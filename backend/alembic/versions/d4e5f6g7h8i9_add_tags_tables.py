"""add tags and user_tags tables

Revision ID: d4e5f6g7h8i9
Revises: c3d4e5f6g7h8
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4e5f6g7h8i9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6g7h8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("color", sa.String(length=7), nullable=False, server_default="#6366f1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.UniqueConstraint("name", name="uq_tags_name"),
    )
    op.create_index("ix_tags_id", "tags", ["id"], unique=False)
    op.create_index("ix_tags_name", "tags", ["name"], unique=False)

    op.create_table(
        "user_tags",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "tag_id", name="pk_user_tags"),
    )
    op.create_index("ix_user_tags_user_id", "user_tags", ["user_id"], unique=False)
    op.create_index("ix_user_tags_tag_id", "user_tags", ["tag_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_user_tags_tag_id", table_name="user_tags")
    op.drop_index("ix_user_tags_user_id", table_name="user_tags")
    op.drop_table("user_tags")

    op.drop_index("ix_tags_name", table_name="tags")
    op.drop_index("ix_tags_id", table_name="tags")
    op.drop_table("tags")
