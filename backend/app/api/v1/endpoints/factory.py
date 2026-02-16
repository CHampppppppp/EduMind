from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.schemas import GenerateRequest, GeneratedContent
from app.core.logger import logger
import json
import asyncio

router = APIRouter()

@router.post("", response_model=GeneratedContent)
async def generate_content(request: GenerateRequest):
    logger.info(f"REST Generation request for Analysis ID: {request.analysisId}")
    # Mock generation logic for REST
    result = {
        "id": "gen-1",
        "slides": [{"title": "Slide 1", "content": "Welcome"}],
        "lessonPlan": "This is a generated lesson plan.",
        "games": [{"name": "Sorting Game", "type": "interactive"}]
    }
    logger.info(f"Generation completed: {result['id']}")
    return result

@router.websocket("/ws")
async def websocket_generate(websocket: WebSocket):
    await websocket.accept()
    logger.info("Factory WebSocket connected")
    try:
        data = await websocket.receive_text()
        try:
            request_data = json.loads(data)
            analysis_id = request_data.get("analysisId")
            modifiers = request_data.get("modifiers", "None")
            logger.info(f"WebSocket Generation Request - AnalysisID: {analysis_id}, Modifiers: {modifiers}")
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in Factory WebSocket")
            await websocket.send_json({"error": "Invalid JSON"})
            return

        # Simulate generation steps
        steps = [
            "正在分析需求...",
            "正在生成大纲...",
            "正在生成幻灯片...",
            "正在设计互动游戏...",
            "正在生成教案...",
            "完成！"
        ]

        logger.info("Starting generation process...")
        for i, step in enumerate(steps):
            await asyncio.sleep(1) # Simulate work
            progress = int((i + 1) / len(steps) * 100)
            await websocket.send_json({
                "type": "progress",
                "step": step,
                "progress": progress
            })
            logger.info(f"Generation Progress: {step} ({progress}%)")

        # Send final result
        final_result = {
            "id": "gen-ws-1",
            "slides": [{"title": "WebSocket Slide 1", "content": "Generated via WebSocket"}],
            "lessonPlan": "This lesson plan was streamed via WebSocket.",
            "games": [{"name": "Streamed Game", "type": "interactive"}]
        }
        await websocket.send_json({
            "type": "result",
            "data": final_result
        })
        logger.info(f"Generation successfully completed: {final_result['id']}")
        
    except WebSocketDisconnect:
        logger.info("Factory WebSocket disconnected")
