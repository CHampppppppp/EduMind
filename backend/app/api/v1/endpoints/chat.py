from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.schemas.schemas import ChatRequest, Message
from app.core.logger import logger
from app.core.config import settings
from app.core.database import get_db_connection
from app.services.ai_service import ai_service
import json
import asyncio
import os
import uuid

try:
    import dashscope
    from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult
except ImportError:
    dashscope = None
    logger.warning("DashScope not installed")

router = APIRouter()

def get_chat_history(chat_id: str, limit: int = 10) -> list:
    conn = get_db_connection()
    history = []
    try:
        with conn.cursor() as cursor:
            # Check if chat exists
            cursor.execute("SELECT id FROM chats WHERE id = %s", (chat_id,))
            if not cursor.fetchone():
                return []
            
            # Get messages
            sql = """
                SELECT role, content 
                FROM messages 
                WHERE chat_id = %s 
                ORDER BY created_at ASC 
                LIMIT %s
            """
            cursor.execute(sql, (chat_id, limit))
            results = cursor.fetchall()
            for row in results:
                history.append({"role": row['role'], "content": row['content']})
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
    finally:
        conn.close()
    return history

def save_message(chat_id: str, role: str, content: str, model: str = None, thinking: str = None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            msg_id = str(uuid.uuid4())
            sql = """
                INSERT INTO messages (id, chat_id, role, content, model, thinking)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (msg_id, chat_id, role, content, model, thinking))
        conn.commit()
    except Exception as e:
        logger.error(f"Error saving message: {e}")
    finally:
        conn.close()

def create_chat_session(title: str = "New Chat", user_id: str = None) -> str:
    conn = get_db_connection()
    chat_id = str(uuid.uuid4())
    try:
        with conn.cursor() as cursor:
            # Ensure user exists if provided, otherwise pick default
            if not user_id:
                cursor.execute("SELECT id FROM users LIMIT 1")
                row = cursor.fetchone()
                if row:
                    user_id = row['id']
                else:
                    # Create default user if none
                    user_id = str(uuid.uuid4())
                    cursor.execute("INSERT INTO users (id, username, password_hash) VALUES (%s, 'admin', 'hash')", (user_id,))
            
            sql = "INSERT INTO chats (id, user_id, title) VALUES (%s, %s, %s)"
            cursor.execute(sql, (chat_id, user_id, title))
        conn.commit()
        return chat_id
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        raise e
    finally:
        conn.close()

@router.post("", response_model=Message)
async def chat(request: ChatRequest):
    logger.info(f"REST Chat request received: {request.content}")
    
    chat_id = request.chat_id
    if not chat_id:
        # Create new chat
        try:
            chat_id = create_chat_session(title=request.content[:20])
        except Exception as e:
            logger.error(f"Failed to create chat session: {e}")
            # Fallback to stateless if DB fails
            chat_id = None
    
    # Save user message if we have a chat_id
    if chat_id:
        save_message(chat_id, "user", request.content)
        
    try:
        # Use provided history if available, otherwise fetch from DB if chat_id exists?
        # For REST, usually provided history is preferred for stateless-like behavior with state.
        # But if we want persistence, we should probably merge or use one.
        # Let's use request.history if provided, otherwise fetch from DB.
        history = request.history
        if not history and chat_id:
             # Exclude the just added message to avoid duplication if we fetched it?
             # Actually get_chat_history fetches everything. 
             # AI service expects history WITHOUT current message usually? 
             # Or generic history.
             # Let's just pass request.history for now to be safe with existing frontend.
             pass

        # Use AIService to process the chat (Full response for REST)
        result = await ai_service.process_chat_full(request.content, history)
        
        response = Message(
            role=result["role"],
            content=result["content"],
            model=result.get("model"),
            thinking=result.get("thinking"),
            chat_id=chat_id
        )
        
        # Save assistant message
        if chat_id:
            save_message(chat_id, "assistant", response.content, response.model, response.thinking)
            
        logger.info(f"REST Chat response generated. Model: {response.model}")
        return response
    except Exception as e:
        logger.error(f"Error in REST chat: {e}")
        return Message(role="assistant", content="抱歉，服务器暂时遇到问题，请稍后再试。", chat_id=chat_id)

class WebSocketASRCallback(RecognitionCallback):
    def __init__(self, websocket: WebSocket, loop):
        self.websocket = websocket
        self.loop = loop
        self.transcribed_text = ""

    def on_open(self) -> None:
        logger.info("ASR Session Started")

    def on_close(self) -> None:
        logger.info("ASR Session Closed")

    def on_event(self, result: RecognitionResult) -> None:
        sentence = result.get_sentence()
        if 'text' in sentence:
            text = sentence['text']
            # Send partial result
            asyncio.run_coroutine_threadsafe(
                self.websocket.send_json({"type": "asr_partial", "content": text}),
                self.loop
            )
            if result.is_sentence_end(sentence):
                self.transcribed_text += text
                # Send sentence result
                asyncio.run_coroutine_threadsafe(
                    self.websocket.send_json({"type": "asr_final", "content": text}),
                    self.loop
                )

    def on_error(self, result: RecognitionResult) -> None:
        logger.error(f"ASR Error: {result}")
        asyncio.run_coroutine_threadsafe(
             self.websocket.send_json({"type": "error", "content": str(result)}),
             self.loop
        )

async def process_llm_request(websocket: WebSocket, text: str, chat_id: str = None):
    logger.info(f"Processing LLM request via WebSocket for: {text}, chat_id: {chat_id}")
    await websocket.send_json({"type": "llm_start", "content": ""})
    
    # If chat_id not provided, try to create one?
    if not chat_id:
        try:
            chat_id = create_chat_session(title=text[:20])
            # Send chat_id back to client? 
            # The current protocol doesn't seem to have a specific message for "chat_started" with ID.
            # We can include it in llm_end or as a separate message.
            await websocket.send_json({"type": "chat_info", "chat_id": chat_id})
        except Exception:
            pass
            
    # Save user message
    if chat_id:
        save_message(chat_id, "user", text)

    # Fetch history if chat_id exists
    history = []
    if chat_id:
        # Get last 10 messages, excluding the one we just saved?
        # Actually get_chat_history sorts ASC.
        # We need to exclude the current message from history passed to LLM context usually.
        # But stream_chat logic might handle it.
        # Let's just fetch simplified history.
        full_history = get_chat_history(chat_id, limit=20)
        # Convert to format expected by AI service (list of dicts with role/content)
        # We should exclude the very last user message which is 'text'
        if full_history and full_history[-1]['content'] == text:
             history = full_history[:-1]
        else:
             history = full_history

    full_response = ""
    full_thinking = ""
    current_model = "unknown"

    try:
        # Use AIService Streaming
        async for event in ai_service.stream_chat(text, history):
            # Pass through the event directly to WebSocket
            # Event types: status, thinking_chunk, thinking_done, llm_chunk, llm_end
            if event["type"] == "llm_chunk":
                # Ensure content is not empty
                if event["content"]:
                    full_response += event["content"]
                    await websocket.send_json(event)
                if "model" in event:
                    current_model = event["model"]
            elif event["type"] == "thinking_chunk":
                full_thinking += event["content"]
                await websocket.send_json(event)
            else:
                await websocket.send_json(event)
        
        # Save assistant response
        if chat_id:
            save_message(chat_id, "assistant", full_response, current_model, full_thinking)
            
    except Exception as e:
        logger.error(f"Error in WebSocket LLM process: {e}")
        await websocket.send_json({"type": "error", "content": "AI processing failed"})

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    loop = asyncio.get_event_loop()
    logger.info("Chat WebSocket connected")
    
    # Use settings instead of os.getenv
    api_key = settings.DASHSCOPE_API_KEY
    
    if dashscope and api_key:
        dashscope.api_key = api_key
    else:
        logger.warning("DASHSCOPE_API_KEY not set or dashscope not installed. ASR will fail.")

    recognition = None
    callback = None
    
    try:
        while True:
            message = await websocket.receive()
            
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
                        if dashscope and api_key:
                            callback = WebSocketASRCallback(websocket, loop)
                            recognition = Recognition(
                                model='paraformer-realtime-v1',
                                format='pcm',
                                sample_rate=16000,
                                callback=callback
                            )
                            recognition.start()
                            logger.info("ASR Started")
                        else:
                            await websocket.send_json({"type": "error", "content": "ASR not configured"})
                            
                    elif msg_type == "stop_recording":
                        if recognition:
                            recognition.stop()
                            logger.info("ASR Stopped")
                            final_text = callback.transcribed_text
                            recognition = None
                            
                            # Do NOT trigger LLM automatically
                            # Just confirm stop
                            await websocket.send_json({"type": "asr_stopped", "content": final_text})
                                
                    elif msg_type == "text_message":
                        chat_id = data.get("chat_id")
                        await process_llm_request(websocket, data.get("content"), chat_id)
                        
                except json.JSONDecodeError:
                    pass
            
    except WebSocketDisconnect:
        logger.info("Chat WebSocket disconnected")
        if recognition:
            try:
                recognition.stop()
            except:
                pass
