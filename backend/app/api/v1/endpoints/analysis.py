from fastapi import APIRouter, HTTPException
from app.schemas.schemas import AnalysisResponse, AnalysisIntent, AnalysisStructureSection
from app.core.logger import logger
from app.core.database import get_db_connection
import json
import uuid

router = APIRouter()

@router.post("", response_model=AnalysisResponse)
async def create_analysis(intent: AnalysisIntent):
    logger.info(f"Creating analysis for topic: {intent.topic}")
    
    # Mock structure generation (In real app, call AI service here)
    structure = [
        { "section": "引言", "points": [f"介绍{intent.topic}的重要性", f"生活中的{intent.topic}例子"] },
        { "section": "核心概念", "points": ["原理讲解", "互动演示", "练习环节"] },
        { "section": "总结", "points": ["回顾重点", "布置作业"] }
    ]
    
    analysis_id = str(uuid.uuid4())
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Get default user
            cursor.execute("SELECT id FROM users LIMIT 1")
            user_row = cursor.fetchone()
            if not user_row:
                # Fallback to create a user if strictly needed, or error
                # For now, let's assume one exists or create a dummy
                user_id = str(uuid.uuid4())
                cursor.execute("INSERT INTO users (id, username, password_hash) VALUES (%s, 'admin', 'hash')", (user_id,))
            else:
                user_id = user_row['id']

            sql = """
                INSERT INTO analysis_results (id, user_id, topic, audience, duration, style, structure)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                analysis_id,
                user_id,
                intent.topic,
                intent.audience,
                intent.duration,
                intent.style,
                json.dumps(structure, ensure_ascii=False)
            ))
        conn.commit()
        logger.info(f"Analysis created with ID: {analysis_id}")
        
        return {
            "intent": intent,
            "structure": structure
        }
        
    except Exception as e:
        logger.error(f"Error creating analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to create analysis")
    finally:
        conn.close()

@router.get("/latest", response_model=AnalysisResponse)
async def get_latest_analysis():
    logger.info("Fetching latest analysis")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT topic, audience, duration, style, structure 
                FROM analysis_results 
                ORDER BY created_at DESC 
                LIMIT 1
            """
            cursor.execute(sql)
            row = cursor.fetchone()
            
            if not row:
                # Return a default/mock if DB is empty to avoid frontend crash on init
                return {
                    "intent": {
                        "topic": "欢迎",
                        "audience": "通用",
                        "duration": 0,
                        "style": "默认"
                    },
                    "structure": []
                }
            
            return {
                "intent": {
                    "topic": row['topic'],
                    "audience": row['audience'],
                    "duration": row['duration'],
                    "style": row['style']
                },
                "structure": json.loads(row['structure']) if isinstance(row['structure'], str) else row['structure']
            }
            
    except Exception as e:
        logger.error(f"Error fetching latest analysis: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        conn.close()

@router.get("/{id}", response_model=AnalysisResponse)
async def get_analysis(id: str):
    logger.info(f"Fetching analysis with ID: {id}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT topic, audience, duration, style, structure 
                FROM analysis_results 
                WHERE id = %s
            """
            cursor.execute(sql, (id,))
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="Analysis not found")
            
            return {
                "intent": {
                    "topic": row['topic'],
                    "audience": row['audience'],
                    "duration": row['duration'],
                    "style": row['style']
                },
                "structure": json.loads(row['structure']) if isinstance(row['structure'], str) else row['structure']
            }
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching analysis {id}: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        conn.close()
