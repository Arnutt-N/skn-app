"""add sender_role to messages

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-03-14 20:05:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "j0k1l2m3n4o5"
down_revision: Union[str, Sequence[str], None] = "i9j0k1l2m3n4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add sender_role enum + column to messages."""
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_type
                WHERE typname = 'senderrole'
            ) THEN
                CREATE TYPE senderrole AS ENUM ('USER', 'BOT', 'ADMIN');
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'messages' AND column_name = 'sender_role'
            ) THEN
                ALTER TABLE messages ADD COLUMN sender_role senderrole;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    """Remove sender_role column + enum from messages."""
    op.execute("ALTER TABLE messages DROP COLUMN IF EXISTS sender_role;")
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_type
                WHERE typname = 'senderrole'
            ) THEN
                DROP TYPE senderrole;
            END IF;
        END $$;
        """
    )
