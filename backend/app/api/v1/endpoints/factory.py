from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.schemas.schemas import GenerateRequest, GeneratedContent
from app.core.logger import logger
from app.core.database import get_db_connection
import json
import asyncio
import uuid

router = APIRouter()

@router.post("", response_model=GeneratedContent)
async def generate_content(request: GenerateRequest):
    logger.info(f"REST Generation request for Analysis ID: {request.analysisId}")
    
    # Mock generation logic (In real app, call AI)
    gen_id = str(uuid.uuid4())
    slides = [{"title": "Slide 1", "content": "Welcome to the class"}]
    lesson_plan = "## Lesson Plan\n\n1. Introduction\n2. Main Content\n3. Summary"
    games = [{"name": "Interactive Quiz", "type": "quiz"}]
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Verify analysis_id exists to satisfy FK constraint
            cursor.execute("SELECT id FROM analysis_results WHERE id = %s", (request.analysisId,))
            if not cursor.fetchone():
                # If not found, we can't insert due to FK.
                # For dev convenience, if analysis doesn't exist, we might want to fail or create a dummy one?
                # Failing is better to enforce consistency.
                raise HTTPException(status_code=404, detail="Analysis ID not found")

            sql = """
                INSERT INTO generated_contents (id, analysis_id, slides, lesson_plan, games)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                gen_id,
                request.analysisId,
                json.dumps(slides, ensure_ascii=False),
                lesson_plan,
                json.dumps(games, ensure_ascii=False)
            ))
        conn.commit()
        logger.info(f"Generation completed and saved: {gen_id}")
        
        return {
            "id": gen_id,
            "slides": slides,
            "lessonPlan": lesson_plan,
            "games": games
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error generating content: {e}")
        raise HTTPException(status_code=500, detail="Generation failed")
    finally:
        conn.close()

@router.websocket("/ws")
async def websocket_generate(websocket: WebSocket):
    await websocket.accept()
    logger.info("Factory WebSocket connected")
    try:
        data = await websocket.receive_text()
        request_data = {}
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

        # Generate final result
        gen_id = str(uuid.uuid4())
        slides = [{"title": "WebSocket Slide 1", "content": "Generated via WebSocket"}]
        lesson_plan = "This lesson plan was streamed via WebSocket."
        games = [{"name": "Streamed Game", "type": "interactive"}]
        
        # Save to DB
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                 # Verify analysis_id exists
                cursor.execute("SELECT id FROM analysis_results WHERE id = %s", (analysis_id,))
                if cursor.fetchone():
                    sql = """
                        INSERT INTO generated_contents (id, analysis_id, slides, lesson_plan, games)
                        VALUES (%s, %s, %s, %s, %s)
                    """
                    cursor.execute(sql, (
                        gen_id,
                        analysis_id,
                        json.dumps(slides, ensure_ascii=False),
                        lesson_plan,
                        json.dumps(games, ensure_ascii=False)
                    ))
                    conn.commit()
                    logger.info(f"WebSocket generation saved to DB: {gen_id}")
                else:
                    logger.warning(f"Analysis ID {analysis_id} not found, skipping DB save for WebSocket gen")
        except Exception as e:
            logger.error(f"Error saving WebSocket generation to DB: {e}")
        finally:
            conn.close()

        # Send final result
        final_result = {
            "id": gen_id,
            "slides": slides,
            "lessonPlan": lesson_plan,
            "games": games
        }
        await websocket.send_json({
            "type": "result",
            "data": final_result
        })
        logger.info(f"Generation successfully completed: {final_result['id']}")
        
    except WebSocketDisconnect:
        logger.info("Factory WebSocket disconnected")
