from fastapi import APIRouter, File, UploadFile
from typing import List
from app.schemas.schemas import KnowledgeItem
from app.core.logger import logger

router = APIRouter()

@router.get("", response_model=List[KnowledgeItem])
async def get_knowledge():
    logger.info("Fetching knowledge base list")
    # Mock data
    result = [
        {
            "id": "1",
            "title": "Physics.pdf",
            "type": "pdf",
            "url": "http://localhost:8000/static/Physics.pdf",
            "status": "ready"
        }
    ]
    logger.info(f"Knowledge base list retrieved: {len(result)} items")
    return result

@router.post("/upload", response_model=KnowledgeItem)
async def upload_knowledge(file: UploadFile = File(...)):
    logger.info(f"Uploading file: {file.filename}, Content-Type: {file.content_type}")
    # Mock upload logic
    result = {
        "id": "2",
        "title": file.filename,
        "type": file.content_type,
        "url": f"http://localhost:8000/static/{file.filename}",
        "status": "ready"
    }
    logger.info(f"File upload successful: {result['id']}")
    return result
