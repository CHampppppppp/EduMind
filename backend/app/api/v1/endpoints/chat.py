from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Header
from app.schemas.schemas import ChatRequest, Message, ChatSession
from app.core.logger import logger
from app.core.database import get_db_connection
from app.services.ai_service import ai_service
import json
import asyncio
import uuid
from typing import List, Optional

router = APIRouter()

def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    if x_user_id:
        return x_user_id
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users LIMIT 1")
            row = cursor.fetchone()
            if row:
                return row['id']
            user_id = str(uuid.uuid4())
            cursor.execute("INSERT INTO users (id, username, password_hash) VALUES (%s, 'default_user', 'default')", (user_id,))
            conn.commit()
            return user_id
    finally:
        conn.close()

def get_chat_history(chat_id: str, user_id: str, limit: int = 50) -> list:
    conn = get_db_connection()
    history = []
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM chats WHERE id = %s AND user_id = %s", (chat_id, user_id))
            if not cursor.fetchone():
                return []
            
            cursor.execute("""
                SELECT role, content, model, thinking, created_at
                FROM messages 
                WHERE chat_id = %s 
                ORDER BY created_at ASC 
                LIMIT %s
            """, (chat_id, limit))
            for row in cursor.fetchall():
                history.append({
                    "role": row['role'], 
                    "content": row['content'],
                    "model": row.get('model'),
                    "thinking": row.get('thinking'),
                    "created_at": str(row['created_at'])
                })
    finally:
        conn.close()
    return history

def get_user_chats(user_id: str, days: int = 3) -> List[ChatSession]:
    conn = get_db_connection()
    chats = []
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, title, created_at
                FROM chats
                WHERE user_id = %s AND created_at >= NOW() - INTERVAL %s DAY
                ORDER BY created_at DESC
            """, (user_id, days))
            for row in cursor.fetchall():
                chats.append(ChatSession(
                    id=row['id'],
                    title=row['title'] or "New Chat",
                    created_at=str(row['created_at'])
                ))
    finally:
        conn.close()
    return chats

@router.get("/history", response_model=List[ChatSession])
async def get_history(days: int = 3, x_user_id: Optional[str] = Header(None)):
    return get_user_chats(get_user_id(x_user_id), days)

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, x_user_id: Optional[str] = Header(None)):
    user_id = get_user_id(x_user_id)
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM messages WHERE chat_id = %s", (chat_id,))
            cursor.execute("DELETE FROM chats WHERE id = %s AND user_id = %s", (chat_id, user_id))
            conn.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Chat not found")
            return {"message": "Chat deleted successfully"}
    finally:
        conn.close()

@router.get("/{chat_id}/messages", response_model=List[Message])
async def get_messages(chat_id: str, x_user_id: Optional[str] = Header(None)):
    user_id = get_user_id(x_user_id)
    history = get_chat_history(chat_id, user_id, limit=100)
    return [Message(**msg, chat_id=chat_id) for msg in history]

def save_message(chat_id: str, role: str, content: str, model: str = None, thinking: str = None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            msg_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO messages (id, chat_id, role, content, model, thinking)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (msg_id, chat_id, role, content, model, thinking))
        conn.commit()
    finally:
        conn.close()

def create_chat_session(title: str = "New Chat", user_id: str = None) -> str:
    if not user_id:
        raise ValueError("User ID is required")
        
    conn = get_db_connection()
    chat_id = str(uuid.uuid4())
    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO chats (id, user_id, title) VALUES (%s, %s, %s)", (chat_id, user_id, title))
        conn.commit()
        return chat_id
    finally:
        conn.close()

@router.post("", response_model=Message)
async def chat(request: ChatRequest, x_user_id: Optional[str] = Header(None)):
    user_id = get_user_id(x_user_id)
    chat_id = request.chat_id
    
    if not chat_id:
        try:
            title = request.content[:20] if request.content else "新对话"
            chat_id = create_chat_session(title=title, user_id=user_id)
        except Exception as e:
            logger.error(f"Failed to create chat session: {e}")
            chat_id = None
    
    if chat_id and request.content:
        save_message(chat_id, "user", request.content)
        
    if not request.content:
        return Message(role="assistant", content="", chat_id=chat_id)

    try:
        history = request.history
        result = await ai_service.process_chat_full(request.content, history)
        
        response = Message(
            role=result["role"],
            content=result["content"],
            model=result.get("model"),
            thinking=result.get("thinking"),
            chat_id=chat_id
        )
        
        if chat_id:
            save_message(chat_id, "assistant", response.content, response.model, response.thinking)
            
        return response
    except Exception as e:
        logger.error(f"Error in REST chat: {e}")
        return Message(role="assistant", content="抱歉，服务器暂时遇到问题，请稍后再试。", chat_id=chat_id)

try:
    import dashscope
    from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult
except ImportError:
    dashscope = None

class WebSocketASRCallback(RecognitionCallback):
    def __init__(self, websocket: WebSocket, loop):
        self.websocket = websocket
        self.loop = loop
        self.transcribed_text = ""

    def on_event(self, result: RecognitionResult) -> None:
        sentence = result.get_sentence()
        if 'text' in sentence:
            text = sentence['text']
            asyncio.run_coroutine_threadsafe(
                self.websocket.send_json({"type": "asr_partial", "content": text}),
                self.loop
            )
            if result.is_sentence_end(sentence):
                self.transcribed_text += text
                asyncio.run_coroutine_threadsafe(
                    self.websocket.send_json({"type": "asr_final", "content": text}),
                    self.loop
                )

    def on_error(self, result: RecognitionResult) -> None:
        asyncio.run_coroutine_threadsafe(
             self.websocket.send_json({"type": "error", "content": str(result)}),
             self.loop
        )

async def process_llm_request(websocket: WebSocket, text: str, chat_id: str = None, user_id: str = None):
    if not user_id:
        user_id = get_user_id(None)
    
    await websocket.send_json({"type": "llm_start", "content": ""})
    
    if not chat_id:
        try:
            chat_id = create_chat_session(title=text[:20], user_id=user_id)
            await websocket.send_json({"type": "chat_info", "chat_id": chat_id})
        except Exception as e:
            logger.error(f"Failed to create chat session: {e}")
            
    if chat_id:
        save_message(chat_id, "user", text)

    history = []
    if chat_id:
        full_history = get_chat_history(chat_id, user_id, limit=20)
        if full_history and full_history[-1]['content'] == text:
             history = full_history[:-1]
        else:
             history = full_history

    full_response = ""
    full_thinking = ""
    current_model = "unknown"

    async def safe_send(data: dict) -> bool:
        try:
            await websocket.send_json(data)
            return True
        except Exception:
            return False

    try:
        async for event in ai_service.stream_chat(text, history):
            if event["type"] == "llm_chunk":
                if event["content"]:
                    full_response += event["content"]
                    if not await safe_send(event):
                        break
                if "model" in event:
                    current_model = event["model"]
            elif event["type"] == "thinking_chunk":
                full_thinking += event["content"]
                if not await safe_send(event):
                    break
            elif event["type"] == "thinking_done":
                pass
            else:
                if not await safe_send(event):
                    break
        
        if chat_id:
            save_message(chat_id, "assistant", full_response, current_model, full_thinking)
            
    except Exception as e:
        logger.error(f"Error in WebSocket LLM process: {e}")

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    loop = asyncio.get_event_loop()
    
    recognition = None
    callback = None
    
    try:
        while True:
            try:
                message = await websocket.receive()
            except RuntimeError as e:
                if "disconnect message has been received" in str(e):
                    break
                raise
            
            if "bytes" in message:
                if recognition:
                    try:
                        recognition.send_audio_frame(message["bytes"])
                    except Exception as e:
                        logger.error(f"ASR send frame error: {e}")
            
            elif "text" in message:
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "start_recording":
                        if dashscope:
                            callback = WebSocketASRCallback(websocket, loop)
                            recognition = Recognition(
                                model='paraformer-realtime-v1',
                                format='pcm',
                                sample_rate=16000,
                                callback=callback
                            )
                            recognition.start()
                        else:
                            await websocket.send_json({"type": "error", "content": "ASR not configured"})
                            
                    elif msg_type == "stop_recording":
                        if recognition:
                            recognition.stop()
                            final_text = callback.transcribed_text
                            recognition = None
                            await websocket.send_json({"type": "asr_stopped", "content": final_text})
                                
                    elif msg_type == "text_message":
                        chat_id = data.get("chat_id")
                        user_id = data.get("user_id") or get_user_id(None)
                        await process_llm_request(websocket, data.get("content"), chat_id, user_id)
                        
                except json.JSONDecodeError:
                    pass
            
    except WebSocketDisconnect:
        if recognition:
            try:
                recognition.stop()
            except:
                pass
