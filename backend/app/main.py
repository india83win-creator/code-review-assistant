from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, projects, files, reviews,chat
from sqlalchemy import inspect, text

Base.metadata.create_all(bind=engine)

def ensure_user_settings_columns():
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("users")}
    defaults = {
        "role": "VARCHAR",
        "ai_provider": "VARCHAR DEFAULT 'ollama'",
        "ai_base_url": "VARCHAR DEFAULT 'http://localhost:11434'",
        "ai_model": "VARCHAR DEFAULT 'llama3'",
        "ai_api_key": "VARCHAR DEFAULT ''",
    }

    with engine.begin() as connection:
        for column_name, definition in defaults.items():
            if column_name not in columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {definition}"))

ensure_user_settings_columns()

app = FastAPI(title="Code Review Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(
    chat.router,
    prefix="/api/chat",
    tags=["chat"]
)

@app.get("/")
def root():
    return {"message": "Code Review Assistant API is running"}
