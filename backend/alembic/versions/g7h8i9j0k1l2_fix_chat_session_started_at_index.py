"""fix chat_sessions index to use started_at

Revision ID: g7h8i9j0k1l2
Revises: f6g7h8i9j0k1
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, Sequence[str], None] = "f6g7h8i9j0k1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _index_exists(connection, index_name: str) -> bool:
    result = connection.execute(
        sa.text("SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = :name)"),
        {"name": index_name},
    )
    return bool(result.scalar())


def upgrade() -> None:
    connection = op.get_bind()
    # Drop incorrect index name/column if present from earlier migration.
    if _index_exists(connection, "idx_chat_sessions_created_at"):
        op.drop_index("idx_chat_sessions_created_at", table_name="chat_sessions")

    if not _index_exists(connection, "idx_chat_sessions_started_at"):
        op.create_index(
            "idx_chat_sessions_started_at",
            "chat_sessions",
            ["started_at"],
            unique=False,
        )


def downgrade() -> None:
    connection = op.get_bind()
    if _index_exists(connection, "idx_chat_sessions_started_at"):
        op.drop_index("idx_chat_sessions_started_at", table_name="chat_sessions")
