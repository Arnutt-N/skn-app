from app.core.config import settings
print(f"DEBUG_SCRIPT: Origins={settings.BACKEND_CORS_ORIGINS}")
print(f"DEBUG_SCRIPT: Type={type(settings.BACKEND_CORS_ORIGINS)}")
