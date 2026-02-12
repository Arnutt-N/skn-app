"""add sync_status to rich_menus

Revision ID: add_sync_status_to_rich_menus
Revises: add_system_settings
Create Date: 2026-01-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_sync_status_to_rich_menus'
down_revision = 'f1a2b3c4d5e6'  # Must run after rich_menus table is created
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if column already exists before adding
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'rich_menus' AND column_name = 'sync_status'
        )
    """))
    column_exists = result.scalar()

    if column_exists:
        return  # Columns already exist, skip

    # Add sync tracking columns to rich_menus table
    op.add_column('rich_menus', sa.Column('sync_status', sa.String(), nullable=True))
    op.add_column('rich_menus', sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('rich_menus', sa.Column('last_sync_error', sa.Text(), nullable=True))

    # Set default value for existing rows
    op.execute("UPDATE rich_menus SET sync_status = 'PENDING' WHERE sync_status IS NULL")


def downgrade() -> None:
    op.drop_column('rich_menus', 'last_sync_error')
    op.drop_column('rich_menus', 'last_synced_at')
    op.drop_column('rich_menus', 'sync_status')
