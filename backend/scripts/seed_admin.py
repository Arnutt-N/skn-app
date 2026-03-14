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
        existing_admin = await db.scalar(
            select(User).where(User.username == "admin").limit(1)
        )
        if existing_admin:
            existing_admin.display_name = existing_admin.display_name or "Administrator"
            existing_admin.role = existing_admin.role or UserRole.ADMIN
            existing_admin.is_active = True
            existing_admin.hashed_password = get_password_hash(password)
            await db.commit()
            print("Admin user updated.")
            return

        existing = await db.scalar(
            select(User.id).where(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])).limit(1)
        )
        if existing:
            print("Another admin user already exists, skipping.")
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
