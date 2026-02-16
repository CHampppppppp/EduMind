from fastapi import APIRouter
from app.api.v1.endpoints import knowledge, chat, analysis, factory

api_router = APIRouter()

api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(factory.router, prefix="/generate", tags=["factory"])
