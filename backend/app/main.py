from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    description="Backend API for SknApp - Community Justice Services. Supports LINE OA integration and LIFF applications.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    openapi_tags=tags_metadata,
    contact={
        "name": "SknApp Support Team",
        "email": "support@skn-app.local",
    },
)

# Set all CORS enabled origins
# For local development, allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to SknApp API"}

app.include_router(api_router, prefix=settings.API_V1_STR)
