from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.project import Project
from ..models.file import File
from ..models.user import User
from jose import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
import os

router = APIRouter()
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = jwt.decode(
        token,
        os.getenv("SECRET_KEY"),
        algorithms=[os.getenv("ALGORITHM")]
    )

    user_id = int(payload.get("sub"))

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


class ChatRequest(BaseModel):
    project_id: int
    question: str

    ai_base_url: str
    ai_api_key: str
    ai_model: str



@router.post("/")
def chat_with_code(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    project = db.query(Project).filter(
        Project.id == data.project_id,
        Project.owner_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    files = db.query(File).filter(
        File.project_id == data.project_id
    ).all()

    if not files:
        raise HTTPException(
            status_code=404,
            detail="No files found"
        )

    code_context = ""

    for file in files:
        code_context += (
            f"\n\n--- FILE: {file.filename} ---\n"
            f"{file.content}"
        )

    prompt = f"""
You are a software engineering assistant.

Use the provided codebase to answer the question.

CODEBASE:

{code_context}

QUESTION:

{data.question}
"""

    if not data.ai_base_url or not data.ai_api_key or not data.ai_model:
        raise HTTPException(
            status_code=400,
            detail="AI Provider Settings not configured"
        )

    print("CHAT BASE URL:", data.ai_base_url)
    print("CHAT API KEY:", data.ai_api_key)
    print("CHAT MODEL:", data.ai_model)

    client = OpenAI(
        base_url=data.ai_base_url,
        api_key=data.ai_api_key
    )
    try:
        response = client.chat.completions.create(
            model=data.ai_model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return {
            "answer": response.choices[0].message.content
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI Chat Failed: {str(e)}"
        )