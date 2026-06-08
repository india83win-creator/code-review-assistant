from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from typing import List
print("FILES ROUTER LOADED")
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.file import File
from ..models.project import Project
from ..models.user import User
from jose import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import shutil

router = APIRouter()
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def save_uploaded_file(file: UploadFile, project_id: int, db: Session, current_user):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing_file = db.query(File).filter(
        File.project_id == project_id,
        File.filename == file.filename
    ).first()

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, file.filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    content = ""
    try:
        with open(filepath, "rb") as f:
            raw_data = f.read()
        try:
            content = raw_data.decode("utf-8")
        except UnicodeDecodeError:
            content = raw_data.decode("latin-1")
    except Exception as e:
        print("ERROR READING FILE:", str(e))
        content = ""

    if existing_file:
        existing_file.filepath = filepath
        existing_file.content = content
        db.commit()
        db.refresh(existing_file)
        return {"id": existing_file.id, "filename": existing_file.filename, "updated": True}

    db_file = File(filename=file.filename, filepath=filepath, content=content, project_id=project_id)
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return {"id": db_file.id, "filename": db_file.filename, "updated": False}


# ✅ Single file upload (existing)
@router.post("/{project_id}/upload")
async def upload_file(
    project_id: int,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return save_uploaded_file(file, project_id, db, current_user)


# ✅ NEW: Multiple file upload
@router.post("/{project_id}/upload-multiple")
async def upload_multiple_files(
    project_id: int,
    files: List[UploadFile] = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = []
    errors = []
    for file in files:
        try:
            result = save_uploaded_file(file, project_id, db, current_user)
            results.append(result)
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
    return {"uploaded": results, "errors": errors, "total": len(results)}


@router.get("/{project_id}")
def get_files(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    files = db.query(File).filter(File.project_id == project_id).all()
    return [{"id": f.id, "filename": f.filename, "uploaded_at": f.uploaded_at} for f in files]


@router.get("/content/{file_id}")
def get_file_content(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return {"filename": file.filename, "content": file.content}


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    project = db.query(Project).filter(
        Project.id == file.project_id,
        Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
    if file.filepath and os.path.exists(file.filepath):
        try:
            os.remove(file.filepath)
        except Exception as e:
            print(f"Could not delete physical file: {e}")
    db.delete(file)
    db.commit()
    return {"message": f"File '{file.filename}' deleted successfully", "id": file_id}