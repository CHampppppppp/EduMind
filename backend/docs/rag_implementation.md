# RAG (Retrieval-Augmented Generation) Implementation Guide

## Overview
We have integrated local ChromaDB vector storage with the AI service to enable RAG.

## Implementation Details

### 1. Knowledge Service (`backend/app/services/knowledge_service.py`)
- Added `query_knowledge(query, n_results=3, user_id=None)` method.
- This method queries the ChromaDB collection for relevant documents based on the user's query and user ID.

### 2. AI Service (`backend/app/services/ai_service.py`)
- Updated `stream_chat` to accept `user_id`.
- Before calling the LLM, the service now calls `knowledge_service.query_knowledge` to retrieve relevant context.
- The retrieved context is appended to the prompt as "Reference Material".
- The LLM is instructed to answer based on this reference material.

### 3. Chat Endpoint (`backend/app/api/v1/endpoints/chat.py`)
- Updated `chat` endpoint and WebSocket handler to pass the `user_id` to the AI service.

## Verification

To verify the RAG functionality:

1.  **Start the Backend**:
    ```bash
    cd backend
    uvicorn app.main:app --reload
    ```

2.  **Upload a Document**:
    - Use the frontend or Swagger UI (`http://localhost:8000/docs`) to upload a document (e.g., a text file with specific information).
    - Endpoint: `POST /api/v1/knowledge/upload`

3.  **Ask a Question**:
    - Use the chat interface to ask a question related to the uploaded document.
    - The AI should now answer based on the content of the document.
    - You can check the logs to see "retrieving_knowledge" and "knowledge_found" statuses.

## Troubleshooting
- Ensure `chromadb` is installed: `pip install chromadb`.
- Check `backend/app/core/logger.py` logs for any errors during retrieval.
