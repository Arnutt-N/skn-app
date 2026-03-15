import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_db
from app.models.media_file import MediaFile
from app.models.user import User
from app.schemas.media import MediaFileListResponse, MediaFileSummary, MediaUploadResponse

router = APIRouter()


@router.get(
    "/media/{media_id}",
    summary="Get uploaded media file",
    response_description="Binary media content",
)
async def get_media(media_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaFile).where(MediaFile.id == media_id))
    media = result.scalar_one_or_none()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    return Response(content=media.data, media_type=media.mime_type)


@router.post(
    "/media",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload media file",
    response_description="Uploaded media identifier",
)
async def upload_media(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    content = await file.read()

    media = MediaFile(
        filename=file.filename or "upload.bin",
        mime_type=file.content_type or "application/octet-stream",
        data=content,
        size_bytes=len(content),
    )

    db.add(media)
    await db.commit()
    await db.refresh(media)

    return MediaUploadResponse(id=media.id, filename=media.filename)


@router.get(
    "/admin/media",
    response_model=MediaFileListResponse,
    summary="List uploaded media files",
    response_description="Uploaded media files available to admins",
)
async def list_media_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _current_admin: User = Depends(get_current_admin),
):
    total = await db.scalar(select(func.count()).select_from(MediaFile)) or 0
    result = await db.execute(
        select(MediaFile)
        .order_by(MediaFile.created_at.desc(), MediaFile.id.desc())
        .offset(skip)
        .limit(limit)
    )
    media_files = result.scalars().all()

    return MediaFileListResponse(
        items=[
            MediaFileSummary(
                id=media.id,
                file_name=media.filename,
                content_type=media.mime_type,
                size=media.size_bytes,
                created_at=media.created_at,
            )
            for media in media_files
        ],
        total=total,
    )


@router.delete(
    "/admin/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete uploaded media file",
    response_description="Media file deleted",
)
async def delete_media(
    media_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(MediaFile).where(MediaFile.id == media_id))
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    await db.delete(media)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
