from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.schemas import ChatRequest, Message
from app.core.logger import logger
import json
import asyncio

router = APIRouter()

@router.post("", response_model=Message)
async def chat(request: ChatRequest):
    logger.info(f"REST Chat request received: {request.content}")
    # Mock chat logic for REST
    response = {
        "role": "assistant",
        "content": f"收到您的消息：{request.content}。这是自动回复。"
    }
    logger.info(f"REST Chat response generated: {response['content']}")
    return response

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Chat WebSocket connected")
    try:
        while True:
            data = await websocket.receive_text()
            # Parse the received JSON
            try:
                message_data = json.loads(data)
                content = message_data.get("content", "")
                history = message_data.get("history", [])
                logger.info(f"WebSocket Message received: {content} | History length: {len(history)}")
            except json.JSONDecodeError:
                content = data
                logger.warning(f"WebSocket received raw text (not JSON): {content}")

            # Simulate streaming response
            response_prefix = f"收到消息：{content}。正在思考..."
            logger.info("AI thinking...")
            await websocket.send_json({"type": "start", "content": ""})
            
            # Send chunks
            chunks = ["这里", "是", "通过", "WebSocket", "流式", "传输", "的", "回复", "。"]
            full_response = ""
            for i, chunk in enumerate(chunks):
                await asyncio.sleep(0.2) # Simulate delay
                await websocket.send_json({"type": "chunk", "content": chunk})
                full_response += chunk
                logger.debug(f"Chunk {i+1}/{len(chunks)} sent: {chunk}")
            
            await websocket.send_json({"type": "end", "content": ""})
            logger.info(f"AI Response completed: {full_response}")
            
    except WebSocketDisconnect:
        logger.info("Chat WebSocket disconnected")
