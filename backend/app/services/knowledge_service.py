import os
import shutil
import uuid
import chromadb
from datetime import datetime
from fastapi import UploadFile
from app.services.ai_service import ai_service
from app.core.logger import logger

UPLOAD_DIR = "upload"
IMAGE_DIR = os.path.join(UPLOAD_DIR, "images")
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audios")
VIDEO_DIR = os.path.join(UPLOAD_DIR, "videos")
DOC_DIR = os.path.join(UPLOAD_DIR, "documents")

# Ensure directories exist
for d in [IMAGE_DIR, AUDIO_DIR, VIDEO_DIR, DOC_DIR]:
    os.makedirs(d, exist_ok=True)

class KnowledgeService:
    def __init__(self):
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_or_create_collection(name="knowledge_base")

    async def process_upload(self, file: UploadFile) -> dict:
        """
        Process uploaded file, extract content/description, and store in ChromaDB.
        """
        file_id = str(uuid.uuid4())
        filename = file.filename
        content_type = file.content_type
        
        # Determine file category and save path
        category = "document"
        save_dir = DOC_DIR
        
        if content_type.startswith("image/"):
            category = "image"
            save_dir = IMAGE_DIR
        elif content_type.startswith("audio/"):
            category = "audio"
            save_dir = AUDIO_DIR
        elif content_type.startswith("video/"):
            category = "video"
            save_dir = VIDEO_DIR
            
        # Generate safe filename with ID to avoid collisions but keep extension
        ext = os.path.splitext(filename)[1]
        if not ext:
            if category == "image": ext = ".jpg"
            elif category == "audio": ext = ".wav"
            elif category == "video": ext = ".mp4"
            else: ext = ".txt"
            
        saved_filename = f"{category}-{file_id}{ext}"
        file_path = os.path.join(save_dir, saved_filename)
        
        # Save file to disk
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            logger.error(f"Failed to save file: {e}")
            raise Exception("File save failed")

        # Process content based on category
        extracted_text = ""
        try:
            if category == "image":
                extracted_text = await ai_service.get_image_description(file_path)
            elif category == "video":
                extracted_text = await ai_service.get_video_description(file_path)
            elif category == "audio":
                extracted_text = await ai_service.get_audio_text(file_path)
            else:
                # Text or Document (PDF, etc.)
                if content_type == "text/plain" or filename.endswith(".txt"):
                    with open(file_path, "r", encoding="utf-8") as f:
                        extracted_text = f.read()
                else:
                    extracted_text = await ai_service.get_document_content(file_path)
        except Exception as e:
            logger.error(f"AI processing failed for {filename}: {e}")
            extracted_text = "Content extraction failed."

        # Store in ChromaDB
        db_id = f"{category}-{file_id}"
        upload_date = datetime.now().isoformat()
        
        try:
            self.collection.add(
                documents=[extracted_text],
                metadatas=[{
                    "type": category,
                    "original_name": filename,
                    "path": file_path,
                    "content_type": content_type,
                    "upload_date": upload_date
                }],
                ids=[db_id]
            )
        except Exception as e:
            logger.error(f"ChromaDB add failed: {e}")
            raise Exception("Database storage failed")

        # Generate URL relative to static mount
        relative_path = os.path.relpath(file_path, UPLOAD_DIR)
        url = f"/static/{relative_path}"

        return {
            "id": db_id,
            "title": filename,
            "type": category,
            "url": url,
            "status": "ready",
            "summary": extracted_text[:100] + "...",
            "uploadDate": upload_date
        }

    def get_all_items(self):
        """
        Get all items from ChromaDB.
        """
        try:
            result = self.collection.get()
            items = []
            if result and result['ids']:
                for i, doc_id in enumerate(result['ids']):
                    metadata = result['metadatas'][i] or {}
                    document = result['documents'][i] or ""
                    
                    file_path = metadata.get("path", "")
                    url = "#"
                    if file_path and os.path.exists(file_path):
                        relative_path = os.path.relpath(file_path, UPLOAD_DIR)
                        url = f"/static/{relative_path}"
                    
                    items.append({
                        "id": doc_id,
                        "title": metadata.get("original_name", "Unknown"),
                        "type": metadata.get("type", "document"),
                        "url": url,
                        "status": "ready",
                        "summary": document[:100] + "..." if document else "No content",
                        "uploadDate": metadata.get("upload_date", datetime.now().isoformat())
                    })
            # Sort by uploadDate descending
            items.sort(key=lambda x: x["uploadDate"], reverse=True)
            return items
        except Exception as e:
            logger.error(f"Error getting items: {e}")
            return []

knowledge_service = KnowledgeService()
