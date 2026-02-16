from fastapi import APIRouter, File, UploadFile, HTTPException, Header
from typing import List, Optional
from app.schemas.schemas import KnowledgeItem
from app.core.logger import logger
from app.services.knowledge_service import knowledge_service

router = APIRouter()

def get_user_id_or_default(x_user_id: Optional[str] = Header(None)) -> Optional[str]:
    """获取用户ID，如果不存在则返回None"""
    return x_user_id

@router.get("", response_model=List[KnowledgeItem])
async def get_knowledge(x_user_id: Optional[str] = Header(None)):
    logger.info(f"Fetching knowledge base list for user: {x_user_id}")
    try:
        items = knowledge_service.get_all_items(x_user_id)
        return items
    except Exception as e:
        logger.error(f"Error fetching knowledge: {e}")
        return []

@router.post("/upload", response_model=KnowledgeItem)
async def upload_knowledge(file: UploadFile = File(...), x_user_id: Optional[str] = Header(None)):
    logger.info(f"Uploading file: {file.filename}, Content-Type: {file.content_type}, user_id: {x_user_id}")
    try:
        result = await knowledge_service.process_upload(file, x_user_id)
        logger.info(f"File upload successful: {result['id']}")
        return result
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{item_id}")
async def delete_knowledge_item(item_id: str, x_user_id: Optional[str] = Header(None)):
    logger.info(f"Deleting knowledge item: {item_id}, user_id: {x_user_id}")
    try:
        success = await knowledge_service.delete_item(item_id, x_user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Item not found or failed to delete")
        return {"status": "success", "message": f"Item {item_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
