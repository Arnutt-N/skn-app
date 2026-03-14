"""Add missing performance indexes

Adds indexes on frequently queried columns:
- chat_sessions: status, closed_at, operator_id
- messages: created_at (standalone)
- audit_logs: resource_type

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-03-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, Sequence[str], None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _index_exists(connection, index_name: str) -> bool:
    """Check if an index exists in PostgreSQL."""
    result = connection.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = :index_name)"
        ),
        {"index_name": index_name},
    )
    return bool(result.scalar())


def upgrade() -> None:
    connection = op.get_bind()

    # ChatSession indexes
    if not _index_exists(connection, "ix_chat_sessions_status"):
        op.create_index(
            "ix_chat_sessions_status", "chat_sessions", ["status"], unique=False
        )

    if not _index_exists(connection, "ix_chat_sessions_closed_at"):
        op.create_index(
            "ix_chat_sessions_closed_at", "chat_sessions", ["closed_at"], unique=False
        )

    if not _index_exists(connection, "ix_chat_sessions_operator_id"):
        op.create_index(
            "ix_chat_sessions_operator_id",
            "chat_sessions",
            ["operator_id"],
            unique=False,
        )

    # Message standalone created_at index (complements existing composite idx_messages_user_created)
    if not _index_exists(connection, "ix_messages_created_at"):
        op.create_index(
            "ix_messages_created_at", "messages", ["created_at"], unique=False
        )

    # AuditLog resource_type index
    if not _index_exists(connection, "ix_audit_logs_resource_type"):
        op.create_index(
            "ix_audit_logs_resource_type",
            "audit_logs",
            ["resource_type"],
            unique=False,
        )


def downgrade() -> None:
    connection = op.get_bind()

    if _index_exists(connection, "ix_audit_logs_resource_type"):
        op.drop_index("ix_audit_logs_resource_type", table_name="audit_logs")

    if _index_exists(connection, "ix_messages_created_at"):
        op.drop_index("ix_messages_created_at", table_name="messages")

    if _index_exists(connection, "ix_chat_sessions_operator_id"):
        op.drop_index("ix_chat_sessions_operator_id", table_name="chat_sessions")

    if _index_exists(connection, "ix_chat_sessions_closed_at"):
        op.drop_index("ix_chat_sessions_closed_at", table_name="chat_sessions")

    if _index_exists(connection, "ix_chat_sessions_status"):
        op.drop_index("ix_chat_sessions_status", table_name="chat_sessions")
