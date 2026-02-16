from typing import List, Optional
from pydantic import BaseModel

# Knowledge Models
class KnowledgeItem(BaseModel):
    id: str
    title: str
    type: str
    url: str
    status: str

# Chat Models
class ChatRequest(BaseModel):
    content: str
    history: List[dict] = []

class Message(BaseModel):
    role: str
    content: str
    model: Optional[str] = None
    thinking: Optional[str] = None

# Analysis Models
class AnalysisIntent(BaseModel):
    topic: str
    audience: str
    duration: int
    style: str

class AnalysisStructureSection(BaseModel):
    section: str
    points: List[str]

class AnalysisResponse(BaseModel):
    intent: AnalysisIntent
    structure: List[AnalysisStructureSection]

# Factory Models
class GenerateRequest(BaseModel):
    analysisId: str
    modifiers: Optional[str] = None

class GeneratedContent(BaseModel):
    id: str
    slides: List[dict]
    lessonPlan: str
    games: List[dict]
