import os
import shutil
import uuid
import chromadb
from datetime import datetime
from fastapi import UploadFile
from app.services.ai_service import ai_service
from app.core.logger import logger
import pymysql
from app.core.config import settings
from app.core.database import get_db_connection
import hashlib
from typing import Optional

UPLOAD_DIR = "upload"
IMAGE_DIR = os.path.join(UPLOAD_DIR, "images")
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audios")
VIDEO_DIR = os.path.join(UPLOAD_DIR, "videos")
DOC_DIR = os.path.join(UPLOAD_DIR, "documents")

# Ensure directories exist
for d in [IMAGE_DIR, AUDIO_DIR, VIDEO_DIR, DOC_DIR]:
    os.makedirs(d, exist_ok=True)

from chromadb.utils import embedding_functions

# Configure ChromaDB to use local cache directory for models if possible
# or just increase timeout/retry logic
# For now, let's just make sure we catch initialization errors gracefully
# and perhaps use a specific model that is known to be small.

class KnowledgeService:
    def __init__(self):
        try:
            # Initialize ChromaDB
            self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
            
            # Explicitly use default embedding function but can be swapped
            # The default is all-MiniLM-L6-v2. 
            # If download fails, user might need to download manually or check network.
            self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
            
            self.collection = self.chroma_client.get_or_create_collection(
                name="knowledge_base",
                embedding_function=self.embedding_fn
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            # Fallback or re-raise depending on how critical this is.
            # For now, we'll log it.
            self.collection = None

    def get_or_create_default_user(self, cursor) -> str:
        """
        Get the default admin user ID, or create it if not exists.
        """
        username = "admin"
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        
        if result:
            return result['id']
        
        # Create default user
        user_id = str(uuid.uuid4())
        password_hash = hashlib.sha256("admin".encode()).hexdigest()
        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"
        
        cursor.execute(
            "INSERT INTO users (id, username, password_hash, avatar_url) VALUES (%s, %s, %s, %s)",
            (user_id, username, password_hash, avatar_url)
        )
        return user_id

    async def process_upload(self, file: UploadFile, user_id: Optional[str] = None) -> dict:
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
        kimi_file_id = None
        
        try:
            if category == "image":
                extracted_text, kimi_file_id = await ai_service.get_image_description(file_path)
            elif category == "video":
                extracted_text, kimi_file_id = await ai_service.get_video_description(file_path)
            elif category == "audio":
                # Audio uses DashScope, so no Kimi file ID
                extracted_text = await ai_service.get_audio_text(file_path)
            else:
                # Text or Document (PDF, etc.)
                if content_type == "text/plain" or filename.endswith(".txt"):
                    with open(file_path, "r", encoding="utf-8") as f:
                        extracted_text = f.read()
                else:
                    extracted_text, kimi_file_id = await ai_service.get_document_content(file_path)
        except Exception as e:
            logger.error(f"AI processing failed for {filename}: {e}")
            extracted_text = "Content extraction failed."

        # Ensure extracted_text is not None
        if extracted_text is None:
            extracted_text = "Content extraction failed."

        # Add filename to the beginning of the text to improve retrieval
        final_text = f"Filename: {filename}\n\n{extracted_text}"

        # Store in ChromaDB
        if not self.collection:
            logger.error("ChromaDB collection not initialized")
            raise Exception("Database not initialized")

        db_id = f"{category}-{file_id}"
        upload_date = datetime.now().isoformat()
        
        metadata = {
            "type": category,
            "original_name": filename,
            "path": file_path,
            "content_type": content_type,
            "upload_date": upload_date,
            "user_id": user_id or "unknown"  # 添加用户ID到元数据
        }
        
        # Add Kimi file ID to metadata if available
        if kimi_file_id:
            metadata["kimi_file_id"] = kimi_file_id
        
        try:
            self.collection.add(
                documents=[final_text],
                metadatas=[metadata],
                ids=[db_id]
            )
        except Exception as e:
            logger.error(f"ChromaDB add failed: {e}")
            raise Exception("Database storage failed")

        # Generate URL relative to static mount
        relative_path = os.path.relpath(file_path, UPLOAD_DIR)
        url = f"/static/{relative_path}"
        
        # Store in MySQL with user_id
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                # Use provided user_id, or fallback to default
                final_user_id = user_id
                if not final_user_id:
                    final_user_id = self.get_or_create_default_user(cursor)
                
                sql = """
                    INSERT INTO knowledge_base (id, user_id, title, type, url, status, summary, upload_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (
                    db_id,
                    final_user_id,
                    filename,
                    category,
                    url,
                    "ready",
                    extracted_text[:500], # Limit summary length
                    upload_date
                ))
            conn.commit()
            conn.close()
            logger.info(f"Stored item in MySQL: {db_id} for user: {final_user_id}")
        except Exception as e:
            logger.error(f"Failed to store in MySQL: {e}")
            # Don't fail the whole request if MySQL fails, as ChromaDB is primary for RAG?
            # Or should we rollback? For now, just log error.

        return {
            "id": db_id,
            "title": filename,
            "type": category,
            "url": url,
            "status": "ready",
            "summary": extracted_text[:100] + "...",
            "uploadDate": upload_date
        }

    def get_all_items(self, user_id: Optional[str] = None):
        """
        Get all items from MySQL (primary) or ChromaDB (fallback), filtered by user_id.
        """
        items = []
        
        # Try fetching from MySQL first, filtered by user_id
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                if user_id:
                    sql = "SELECT id, title, type, url, status, summary, upload_date FROM knowledge_base WHERE user_id = %s ORDER BY upload_date DESC"
                    cursor.execute(sql, (user_id,))
                else:
                    # If no user_id provided, return empty list for security
                    logger.warning("get_all_items called without user_id, returning empty list")
                    return []
                
                results = cursor.fetchall()
                for row in results:
                    items.append({
                        "id": row['id'],
                        "title": row['title'],
                        "type": row['type'],
                        "url": row['url'],
                        "status": row['status'],
                        "summary": row['summary'],
                        "uploadDate": row['upload_date'].isoformat() if isinstance(row['upload_date'], datetime) else str(row['upload_date'])
                    })
            conn.close()
            if items:
                return items
        except Exception as e:
            logger.error(f"Error getting items from MySQL: {e}")
            # Fallback to ChromaDB below

        # Fallback to ChromaDB (with user_id filtering in metadata)
        try:
            # Query ChromaDB with user_id filter
            if user_id:
                result = self.collection.get(where={"user_id": user_id})
            else:
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

    def query_knowledge(self, query: str, n_results: int = 3, user_id: Optional[str] = None) -> list[str]:
        """
        Query the knowledge base for relevant documents.
        """
        if not self.collection:
            logger.warning("ChromaDB collection not initialized.")
            return []
            
        try:
            where_filter = {}
            if user_id:
                where_filter["user_id"] = user_id
                
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_filter if where_filter else None
            )
            
            documents = []
            if results and results['documents']:
                for doc_list in results['documents']:
                    documents.extend(doc_list)
                    
            return documents
        except Exception as e:
            logger.error(f"Error querying knowledge base: {e}")
            return []

    async def delete_item(self, item_id: str, user_id: Optional[str] = None) -> bool:
        """
        Delete an item from ChromaDB, filesystem, Kimi, and MySQL.
        Verifies that the item belongs to the user before deletion.
        """
        # First, verify ownership via MySQL
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                if user_id:
                    cursor.execute("SELECT id FROM knowledge_base WHERE id = %s AND user_id = %s", (item_id, user_id))
                else:
                    # If no user_id, deny deletion for security
                    logger.warning(f"Delete attempted without user_id for item: {item_id}")
                    return False
                    
                result = cursor.fetchone()
                if not result:
                    logger.warning(f"Item {item_id} not found or does not belong to user {user_id}")
                    conn.close()
                    return False
            conn.close()
        except Exception as e:
            logger.error(f"Error verifying item ownership: {e}")
            return False
            
        try:
            # 1. Delete from MySQL first (metadata)
            try:
                conn = get_db_connection()
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM knowledge_base WHERE id = %s", (item_id,))
                conn.commit()
                conn.close()
                logger.info(f"Deleted item from MySQL: {item_id}")
            except Exception as e:
                logger.error(f"Error deleting from MySQL: {e}")

            if not self.collection:
                raise Exception("Database not initialized")
                
            # 2. Get item metadata to find file path and potentially Kimi file ID
            result = self.collection.get(ids=[item_id])
            if not result or not result['ids']:
                logger.warning(f"Item not found in ChromaDB: {item_id}")
                # Even if not found in ChromaDB, we might have deleted from MySQL successfully
                # return True if at least MySQL deletion worked? 
                # Or proceed to try to cleanup files anyway if we can infer path?
                # Without Chroma metadata we don't know the file path easily unless we query MySQL first.
                # But we already deleted from MySQL.
                # Let's assume if it's gone from MySQL, it's "deleted" for the user.
                return True
                
            metadatas = result['metadatas']
            file_path = None
            kimi_file_id = None
            
            if metadatas and metadatas[0]:
                file_path = metadatas[0].get("path")
                kimi_file_id = metadatas[0].get("kimi_file_id") # We need to store this!
                
            # 2. Delete from Kimi if ID exists
            if kimi_file_id:
                await ai_service.delete_file(kimi_file_id)
                
            # 3. Delete file from disk
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Deleted file: {file_path}")
                except Exception as e:
                    logger.error(f"Error deleting file {file_path}: {e}")
            
            # 4. Delete from ChromaDB
            self.collection.delete(ids=[item_id])
            logger.info(f"Deleted item from ChromaDB: {item_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting item {item_id}: {e}")
            return False

knowledge_service = KnowledgeService()
