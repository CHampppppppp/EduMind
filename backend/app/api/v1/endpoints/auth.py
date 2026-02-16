from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import UserCreate, UserLogin, UserResponse
from typing import Dict, List
import uuid

router = APIRouter()

# Simple in-memory storage
# Format: {username: {"id": str, "password": str, "username": str, "avatar_url": str}}
USERS_DB: Dict[str, dict] = {}

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate):
    if user.username in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    user_id = str(uuid.uuid4())
    # Generate a random avatar URL (using a placeholder service)
    avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}"
    
    new_user = {
        "id": user_id,
        "username": user.username,
        "password": user.password, # In a real app, hash this!
        "avatar_url": avatar_url
    }
    
    USERS_DB[user.username] = new_user
    
    return new_user

@router.post("/login", response_model=UserResponse)
def login(user: UserLogin):
    if user.username not in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    stored_user = USERS_DB[user.username]
    
    if user.password != stored_user["password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
    return stored_user
