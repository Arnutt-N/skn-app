"""add daily_message_stats materialized view

Revision ID: f6g7h8i9j0k1
Revises: e5f6g7h8i9j0
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f6g7h8i9j0k1"
down_revision: Union[str, Sequence[str], None] = "e5f6g7h8i9j0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    view_exists = conn.execute(
        sa.text(
            """
            SELECT EXISTS (
              SELECT 1 FROM pg_matviews
              WHERE schemaname = 'public' AND matviewname = 'daily_message_stats'
            )
            """
        )
    ).scalar()

    if not view_exists:
        op.execute(
            sa.text(
                """
                CREATE MATERIALIZED VIEW daily_message_stats AS
                SELECT
                    date_trunc('day', created_at) AS day,
                    line_user_id,
                    COUNT(*) AS message_count,
                    COUNT(*) FILTER (WHERE direction = 'INCOMING') AS incoming_count,
                    COUNT(*) FILTER (WHERE direction = 'OUTGOING') AS outgoing_count
                FROM messages
                GROUP BY 1, 2
                """
            )
        )

    op.execute(
        sa.text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_message_stats_day_user
            ON daily_message_stats(day, line_user_id)
            """
        )
    )
    op.execute(
        sa.text(
            """
            CREATE INDEX IF NOT EXISTS idx_daily_message_stats_day
            ON daily_message_stats(day)
            """
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP MATERIALIZED VIEW IF EXISTS daily_message_stats CASCADE"))
