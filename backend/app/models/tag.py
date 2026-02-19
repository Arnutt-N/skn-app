from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(7), nullable=False, default="#6366f1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", secondary="user_tags", back_populates="tags", overlaps="tag_links,user_links,user,tag")
    user_links = relationship(
        "UserTag",
        back_populates="tag",
        cascade="all, delete-orphan",
        overlaps="users,tags,user,tag_links",
    )


class UserTag(Base):
    __tablename__ = "user_tags"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="tag_links", overlaps="tags,users,user_links")
    tag = relationship("Tag", back_populates="user_links", overlaps="tags,users,tag_links")
