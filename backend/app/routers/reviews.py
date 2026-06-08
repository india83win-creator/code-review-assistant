from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.review import Review
from ..models.file import File
from ..models.project import Project
from ..models.user import User
from jose import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import json
import re
from openai import OpenAI

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

REVIEW_PROMPTS = {
    "security": "You are a security code reviewer. Analyze the code for: hardcoded credentials, authentication issues, input validation problems, injection risks. Return JSON with keys: summary, issues (list with severity: critical/high/medium/low, and description), recommendations (list).",
    "performance": "You are a performance code reviewer. Analyze the code for: slow operations, inefficient rendering, unnecessary database queries. Return JSON with keys: summary, issues (list with severity and description), recommendations (list).",
    "quality": "You are a code quality reviewer. Analyze the code for: naming conventions, structure, readability, maintainability. Return JSON with keys: summary, issues (list with severity and description), recommendations (list).",
    "general": "You are an expert code reviewer. Provide a comprehensive review. Return JSON with keys: summary, issues (list with severity: critical/high/medium/low, and description), recommendations (list). Return ONLY raw JSON, no markdown, no code fences."
}

class ReviewRequest(BaseModel):
    project_id: int
    file_id: Optional[int] = None
    review_type: str = "general"
    ai_base_url: str
    ai_api_key: str
    ai_model: str


@router.post("/")
def create_review(data: ReviewRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == data.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.file_id:
        files = db.query(File).filter(File.id == data.file_id, File.project_id == data.project_id).all()
    else:
        files = db.query(File).filter(File.project_id == data.project_id).all()

    if not files:
        raise HTTPException(status_code=404, detail="No files found")

    code_content = ""
    for f in files:
        code_content += f"\n\n--- File: {f.filename} ---\n{f.content}"

    if not data.ai_base_url or not data.ai_api_key or not data.ai_model:
        raise HTTPException(status_code=400, detail="AI Provider Settings not configured")

    print("AI BASE URL:", data.ai_base_url)
    print("AI API KEY:", data.ai_api_key[:12], "...")
    print("AI MODEL:", data.ai_model)

    prompt = REVIEW_PROMPTS.get(data.review_type, REVIEW_PROMPTS["general"])

    try:
        client = OpenAI(base_url=data.ai_base_url, api_key=data.ai_api_key)
        response = client.chat.completions.create(
            model=data.ai_model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Review this code:\n{code_content}"}
            ]
            # ✅ removed response_format — not supported by all providers
        )
        raw = response.choices[0].message.content
        print("RAW AI RESPONSE:", raw[:300])

        # Strip markdown code fences if present
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
        result = json.loads(cleaned)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI review failed: {str(e)}")

    review = Review(
        project_id=data.project_id,
        file_id=data.file_id,
        review_type=data.review_type,
        summary=result.get("summary", ""),
        issues=result.get("issues", []),
        recommendations=result.get("recommendations", [])
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {
        "id": review.id,
        "summary": review.summary,
        "issues": review.issues,
        "recommendations": review.recommendations,
        "review_type": review.review_type,
        "created_at": review.created_at
    }

@router.get("/{project_id}")
def get_reviews(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reviews = db.query(Review).filter(Review.project_id == project_id).all()
    return [{"id": r.id, "review_type": r.review_type, "summary": r.summary, "created_at": r.created_at} for r in reviews]

@router.get("/detail/{review_id}")
def get_review_detail(review_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return {
        "id": review.id,
        "review_type": review.review_type,
        "summary": review.summary,
        "issues": review.issues,
        "recommendations": review.recommendations,
        "created_at": review.created_at
    }