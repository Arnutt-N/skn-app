"""add_operator_name_to_messages

Revision ID: a9b8c7d6e5f4
Revises: 157caa418be7
Create Date: 2026-01-25 15:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9b8c7d6e5f4'
down_revision: Union[str, None] = '157caa418be7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add operator_name column to messages table."""
    # Add operator_name column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'messages' AND column_name = 'operator_name'
            ) THEN
                ALTER TABLE messages ADD COLUMN operator_name VARCHAR;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Remove operator_name column from messages table."""
    op.execute("ALTER TABLE messages DROP COLUMN IF EXISTS operator_name;")
