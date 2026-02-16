from fastapi import APIRouter
from app.schemas.schemas import AnalysisResponse
from app.core.logger import logger

router = APIRouter()

@router.get("/latest", response_model=AnalysisResponse)
async def get_latest_analysis():
    logger.info("Fetching latest analysis")
    # Mock analysis logic
    result = {
        "intent": {
            "topic": "排序",
            "audience": "大一新生",
            "duration": 45,
            "style": "可视化"
        },
        "structure": [
            { "section": "引言", "points": ["介绍排序的重要性", "生活中的排序例子"] },
            { "section": "冒泡排序", "points": ["原理讲解", "动画演示", "代码实现"] }
        ]
    }
    logger.info(f"Analysis retrieved: {result['intent']['topic']}")
    return result

@router.get("/{id}", response_model=AnalysisResponse)
async def get_analysis(id: str):
    logger.info(f"Fetching analysis with ID: {id}")
    # Mock logic
    result = {
        "intent": {
            "topic": "排序",
            "audience": "大一新生",
            "duration": 45,
            "style": "可视化"
        },
        "structure": [
            { "section": "引言", "points": ["介绍排序的重要性", "生活中的排序例子"] },
            { "section": "冒泡排序", "points": ["原理讲解", "动画演示", "代码实现"] }
        ]
    }
    logger.info(f"Analysis ID {id} retrieved successfully")
    return result
