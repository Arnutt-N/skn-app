"""merge_all_heads

Revision ID: cfac53729da9
Revises: 8a9b1c2d3e4f, a9b8c7d6e5f4, add_sync_status_to_rich_menus
Create Date: 2026-01-31 23:07:01.910397

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cfac53729da9'
down_revision: Union[str, Sequence[str], None] = ('8a9b1c2d3e4f', 'a9b8c7d6e5f4', 'add_sync_status_to_rich_menus')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
