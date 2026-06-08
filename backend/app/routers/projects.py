from fastapi import UploadFile, File
from ..models.file import File as FileModel
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.project import Project
from ..models.user import User
from jose import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

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

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

@router.post("/")
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(name=data.name, description=data.description, owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"id": project.id, "name": project.name, "description": project.description, "created_at": project.created_at}

@router.get("/")
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    return [{"id": p.id, "name": p.name, "description": p.description, "created_at": p.created_at} for p in projects]

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}

from fastapi import UploadFile, File
from ..models.file import File as FileModel
import shutil
from pathlib import Path

@router.post("/{project_id}/upload")
def upload_file(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)

    file_path = upload_dir / file.filename

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Read content
    content = ""

    try:
        with open(file_path, "rb") as f:
            raw_data = f.read()

        try:
            content = raw_data.decode("utf-8")
        except UnicodeDecodeError:
            content = raw_data.decode("latin-1")

        print("CONTENT LENGTH:", len(content))

    except Exception as e:
        print("ERROR:", str(e))
        content = ""

    # Save to database
    db_file = FileModel(
        filename=file.filename,
        filepath=str(file_path),
        content=content,
        project_id=project.id
    )

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    print("SAVING CONTENT LENGTH =", len(content))

    return {
        "message": "File uploaded successfully",
        "file_id": db_file.id,
        "filename": db_file.filename,
        "content_length": len(content)
    }