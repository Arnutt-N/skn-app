"""merge_migration_heads

Revision ID: 157caa418be7
Revises: add_system_settings, f1a2b3c4d5e6
Create Date: 2026-01-25 15:48:24.183091

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '157caa418be7'
down_revision: Union[str, Sequence[str], None] = ('add_system_settings', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
