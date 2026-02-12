"""Seed a default admin user if no admin users exist."""
import asyncio
import os

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole


async def seed_admin() -> None:
    password = os.getenv("ADMIN_DEFAULT_PASSWORD")
    if not password:
        raise RuntimeError("ADMIN_DEFAULT_PASSWORD is required")

    async with AsyncSessionLocal() as db:
        existing = await db.scalar(
            select(User.id).where(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])).limit(1)
        )
        if existing:
            print("Admin user already exists, skipping.")
            return

        admin = User(
            username="admin",
            display_name="Administrator",
            role=UserRole.ADMIN,
            hashed_password=get_password_hash(password),
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print("Default admin user created.")


if __name__ == "__main__":
    asyncio.run(seed_admin())
