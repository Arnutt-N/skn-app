from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.media_file import MediaFile
from app.api.deps import get_db
import uuid
import io

router = APIRouter()

@router.get("/media/{media_id}")
async def get_media(media_id: uuid.UUID):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(MediaFile).filter(MediaFile.id == media_id))
        media = result.scalar_one_or_none()
        
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
            
        return Response(content=media.data, media_type=media.mime_type)

@router.post("/media")
async def upload_media(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    content = await file.read()
    
    media = MediaFile(
        filename=file.filename,
        mime_type=file.content_type,
        data=content,
        size_bytes=len(content)
    )
    
    db.add(media)
    await db.commit()
    await db.refresh(media)
    
    return {"id": str(media.id), "filename": media.filename}
