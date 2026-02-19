import re
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag, UserTag
from app.models.user import User

HEX_COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")


class TagService:
    async def list_tags(self, db: AsyncSession) -> list[Tag]:
        result = await db.execute(select(Tag).order_by(Tag.name.asc()))
        return list(result.scalars().all())

    async def create_tag(self, db: AsyncSession, name: str, color: str = "#6366f1") -> Tag:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValueError("Tag name is required")
        if not HEX_COLOR_PATTERN.match(color):
            raise ValueError("Tag color must be a hex color, e.g. #22c55e")

        tag = Tag(name=normalized_name, color=color)
        db.add(tag)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise ValueError("Tag name already exists")
        await db.refresh(tag)
        return tag

    async def assign_tag_to_user(self, db: AsyncSession, user_id: int, tag_id: int) -> UserTag:
        user = await db.get(User, user_id)
        if not user:
            raise LookupError("User not found")
        tag = await db.get(Tag, tag_id)
        if not tag:
            raise LookupError("Tag not found")

        existing = await db.get(UserTag, {"user_id": user_id, "tag_id": tag_id})
        if existing:
            return existing

        mapping = UserTag(user_id=user_id, tag_id=tag_id)
        db.add(mapping)
        await db.commit()
        await db.refresh(mapping)
        return mapping

    async def remove_tag_from_user(self, db: AsyncSession, user_id: int, tag_id: int) -> bool:
        result = await db.execute(
            delete(UserTag).where(UserTag.user_id == user_id, UserTag.tag_id == tag_id)
        )
        deleted = result.rowcount > 0
        await db.commit()
        return deleted

    async def list_user_tags(self, db: AsyncSession, user_id: int) -> list[Tag]:
        result = await db.execute(
            select(Tag)
            .join(UserTag, UserTag.tag_id == Tag.id)
            .where(UserTag.user_id == user_id)
            .order_by(Tag.name.asc())
        )
        return list(result.scalars().all())

    async def get_tag(self, db: AsyncSession, tag_id: int) -> Optional[Tag]:
        return await db.get(Tag, tag_id)


tag_service = TagService()
