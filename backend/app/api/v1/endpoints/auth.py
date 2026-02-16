from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import UserCreate, UserLogin, UserResponse
from typing import Dict, List
import uuid
import hashlib
from app.core.database import get_db_connection
from app.core.logger import logger

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE username = %s", (user.username,))
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already registered"
                )
            
            user_id = str(uuid.uuid4())
            # Generate a random avatar URL (using a placeholder service)
            avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}"
            password_hash = hash_password(user.password)
            
            cursor.execute(
                "INSERT INTO users (id, username, password_hash, avatar_url) VALUES (%s, %s, %s, %s)",
                (user_id, user.username, password_hash, avatar_url)
            )
            conn.commit()
            
            new_user = {
                "id": user_id,
                "username": user.username,
                "avatar_url": avatar_url
            }
            return new_user
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    finally:
        conn.close()

@router.post("/login", response_model=UserResponse)
def login(user: UserLogin):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, password_hash, avatar_url FROM users WHERE username = %s", 
                (user.username,)
            )
            stored_user = cursor.fetchone()
            
            if not stored_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password"
                )
            
            if hash_password(user.password) != stored_user["password_hash"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password"
                )
                
            return {
                "id": stored_user["id"],
                "username": stored_user["username"],
                "avatar_url": stored_user["avatar_url"]
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    finally:
        conn.close()
