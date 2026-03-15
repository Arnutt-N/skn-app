from datetime import datetime, timezone
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from app.api.v1.endpoints import media
from app.models.user import UserRole


def _admin_user():
    return SimpleNamespace(id=1, role=UserRole.ADMIN, username="admin")


@pytest.mark.asyncio
async def test_upload_media_returns_created_payload():
    db = AsyncMock()
    db.add = MagicMock()

    async def _refresh(obj):
        obj.id = uuid4()

    db.refresh.side_effect = _refresh

    file = UploadFile(
        BytesIO(b"hello world"),
        filename="manual.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )

    response = await media.upload_media(file=file, db=db)

    assert response.filename == "manual.pdf"
    assert response.id is not None
    db.add.assert_called_once()
    db.commit.assert_awaited_once()

    saved_media = db.add.call_args.args[0]
    assert saved_media.filename == "manual.pdf"
    assert saved_media.mime_type == "application/pdf"
    assert saved_media.size_bytes == 11


@pytest.mark.asyncio
async def test_list_media_files_serializes_media_rows():
    media_file = SimpleNamespace(
        id=uuid4(),
        filename="manual.pdf",
        mime_type="application/pdf",
        size_bytes=2048,
        created_at=datetime(2026, 3, 15, 10, 0, tzinfo=timezone.utc),
    )

    db = AsyncMock()
    db.scalar.return_value = 1
    result = MagicMock()
    scalars = MagicMock()
    scalars.all.return_value = [media_file]
    result.scalars.return_value = scalars
    db.execute.return_value = result

    response = await media.list_media_files(skip=0, limit=200, db=db, _current_admin=_admin_user())

    assert response.total == 1
    assert len(response.items) == 1
    assert response.items[0].file_name == "manual.pdf"
    assert response.items[0].content_type == "application/pdf"
    assert response.items[0].size == 2048


@pytest.mark.asyncio
async def test_delete_media_removes_existing_row():
    media_file = SimpleNamespace(id=uuid4(), filename="manual.pdf")

    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = media_file
    db.execute.return_value = result

    response = await media.delete_media(media_id=media_file.id, db=db, _current_admin=_admin_user())

    assert response.status_code == 204
    db.delete.assert_awaited_once_with(media_file)
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_media_raises_404_when_missing():
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    db.execute.return_value = result

    with pytest.raises(HTTPException) as exc:
        await media.delete_media(media_id=uuid4(), db=db, _current_admin=_admin_user())

    assert exc.value.status_code == 404
    assert exc.value.detail == "Media not found"
