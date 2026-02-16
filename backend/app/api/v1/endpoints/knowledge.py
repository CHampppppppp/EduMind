from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List
from app.schemas.schemas import KnowledgeItem
from app.core.logger import logger
from app.services.knowledge_service import knowledge_service

router = APIRouter()

@router.get("", response_model=List[KnowledgeItem])
async def get_knowledge():
    logger.info("Fetching knowledge base list from ChromaDB")
    try:
        items = knowledge_service.get_all_items()
        return items
    except Exception as e:
        logger.error(f"Error fetching knowledge: {e}")
        return []

@router.post("/upload", response_model=KnowledgeItem)
async def upload_knowledge(file: UploadFile = File(...)):
    logger.info(f"Uploading file: {file.filename}, Content-Type: {file.content_type}")
    try:
        result = await knowledge_service.process_upload(file)
        logger.info(f"File upload successful: {result['id']}")
        return result
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{item_id}")
async def delete_knowledge_item(item_id: str):
    logger.info(f"Deleting knowledge item: {item_id}")
    try:
        success = await knowledge_service.delete_item(item_id)
        if not success:
            raise HTTPException(status_code=404, detail="Item not found or failed to delete")
        return {"status": "success", "message": f"Item {item_id} deleted"}
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
