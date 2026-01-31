from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.api import api_router

tags_metadata = [
    {"name": "line", "description": "Webhook endpoints for LINE Messaging API integration."},
    {"name": "liff", "description": "Endpoints serving data for LIFF (LINE Front-end Framework) applications."},
    {"name": "locations", "description": "Geography data (Provinces, Districts, Sub-districts)."},
    {"name": "media", "description": "Media upload and management."},
    {"name": "admin", "description": "Administrative management endpoints."},
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for JskApp - Community Justice Services. Supports LINE OA integration and LIFF applications.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    openapi_tags=tags_metadata,
    contact={
        "name": "JskApp Support Team",
        "email": "support@jsk-app.local",
    },
)

# Set all CORS enabled origins
# For local development, allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to JskApp API"}

@app.on_event("startup")
async def startup_event():
    from app.db.session import engine
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR NOT NULL UNIQUE,
                value TEXT,
                description VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_system_settings_key ON system_settings (key)"))
        print("Database initialized: system_settings table ensured.")

import os
# Find 'uploads' directory relative to the current working directory or main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
# Try both app parent and current CWD for flexibility
UPLOADS_DIR = os.path.join(ROOT_DIR, "uploads")
if not os.path.exists(UPLOADS_DIR):
    UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")

print(f"DEBUG: Static files serving from: {UPLOADS_DIR}")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(api_router, prefix=settings.API_V1_STR)
