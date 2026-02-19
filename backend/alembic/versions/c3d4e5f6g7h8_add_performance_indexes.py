"""add performance indexes for live chat and analytics

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-02-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6g7h8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6g7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _index_exists(connection, index_name: str) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = :index_name)"
        ),
        {"index_name": index_name},
    )
    return bool(result.scalar())


def upgrade() -> None:
    connection = op.get_bind()
    if not _index_exists(connection, "idx_chat_sessions_started_at"):
        op.create_index(
            "idx_chat_sessions_started_at",
            "chat_sessions",
            ["started_at"],
            unique=False,
        )
    if not _index_exists(connection, "idx_chat_sessions_claimed_at"):
        op.create_index(
            "idx_chat_sessions_claimed_at",
            "chat_sessions",
            ["claimed_at"],
            unique=False,
        )
    if not _index_exists(connection, "idx_messages_user_created"):
        op.execute(
            sa.text(
                "CREATE INDEX idx_messages_user_created ON messages (line_user_id, created_at DESC)"
            )
        )


def downgrade() -> None:
    op.drop_index("idx_messages_user_created", table_name="messages")
    op.drop_index("idx_chat_sessions_claimed_at", table_name="chat_sessions")
    op.drop_index("idx_chat_sessions_started_at", table_name="chat_sessions")
