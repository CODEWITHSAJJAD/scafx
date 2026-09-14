from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from src.app.auth.dependencies import get_current_user
from src.app.auth.jwt import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

class AuthRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]

users_db: Dict[str, Dict[str, Any]] = {}

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: AuthRequest) -> AuthResponse:
    if payload.email in users_db:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")
    user_id = f"user_{len(users_db) + 1}"
    hashed = hash_password(payload.password)
    users_db[payload.email] = {"id": user_id, "email": payload.email, "password": hashed}
    token = create_access_token({"userId": user_id, "email": payload.email})
    return AuthResponse(token=token, user={"id": user_id, "email": payload.email})

@router.post("/login", response_model=AuthResponse)
async def login(payload: AuthRequest) -> AuthResponse:
    user = users_db.get(payload.email)
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token({"userId": user["id"], "email": user["email"]})
    return AuthResponse(token=token, user={"id": user["id"], "email": user["email"]})

@router.get("/me")
async def me(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return {"user": current_user}
