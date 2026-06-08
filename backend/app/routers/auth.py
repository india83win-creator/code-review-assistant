from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User
from passlib.context import CryptContext
from jose import jwt
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AISettingsRequest(BaseModel):
    provider: str = "ollama"
    baseUrl: str = "http://localhost:11434"
    modelName: str = "llama3"
    apiKey: str = ""

def user_payload(user: User):
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "ai_settings": {
            "provider": user.ai_provider or "ollama",
            "baseUrl": user.ai_base_url or "http://localhost:11434",
            "modelName": user.ai_model or "llama3",
            "apiKey": user.ai_api_key or "",
        }
    }

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = pwd_context.hash(data.password)
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hashed,
        role="member",
        ai_provider="ollama",
        ai_base_url="http://localhost:11434",
        ai_model="llama3",
        ai_api_key=""
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created successfully", "user_id": user.id}

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"sub": str(user.id)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", **user_payload(user)}

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return user_payload(current_user)

@router.put("/settings")
def update_settings(data: AISettingsRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.ai_provider = data.provider
    current_user.ai_base_url = data.baseUrl
    current_user.ai_model = data.modelName
    current_user.ai_api_key = data.apiKey
    db.commit()
    db.refresh(current_user)
    return user_payload(current_user)
