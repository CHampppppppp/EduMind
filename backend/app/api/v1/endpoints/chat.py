from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.schemas import ChatRequest, Message
from app.core.logger import logger
from app.core.config import settings
from app.services.ai_service import ai_service
import json
import asyncio
import os

try:
    import dashscope
    from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult
except ImportError:
    dashscope = None
    logger.warning("DashScope not installed")

router = APIRouter()

@router.post("", response_model=Message)
async def chat(request: ChatRequest):
    logger.info(f"REST Chat request received: {request.content}")
    
    try:
        # Use AIService to process the chat (Full response for REST)
        result = await ai_service.process_chat_full(request.content, request.history)
        
        response = Message(
            role=result["role"],
            content=result["content"],
            model=result.get("model"),
            thinking=result.get("thinking")
        )
        logger.info(f"REST Chat response generated. Model: {response.model}")
        return response
    except Exception as e:
        logger.error(f"Error in REST chat: {e}")
        return Message(role="assistant", content="抱歉，服务器暂时遇到问题，请稍后再试。")

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

async def process_llm_request(websocket: WebSocket, text: str):
    logger.info(f"Processing LLM request via WebSocket for: {text}")
    await websocket.send_json({"type": "llm_start", "content": ""})
    
    try:
        # Use AIService Streaming
        async for event in ai_service.stream_chat(text, []):
            # Pass through the event directly to WebSocket
            # Event types: status, thinking_chunk, thinking_done, llm_chunk, llm_end
            if event["type"] == "llm_chunk":
                # Ensure content is not empty
                if event["content"]:
                    await websocket.send_json(event)
            else:
                await websocket.send_json(event)
        
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
                        await process_llm_request(websocket, data.get("content"))
                        
                except json.JSONDecodeError:
                    pass
            
    except WebSocketDisconnect:
        logger.info("Chat WebSocket disconnected")
        if recognition:
            try:
                recognition.stop()
            except:
                pass
