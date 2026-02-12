"""add_rich_menus_table

Revision ID: e3f4g5h6i7j8
Revises: d2df2a419a56
Create Date: 2026-01-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4g5h6i7j8'
down_revision: Union[str, Sequence[str], None] = 'cd2257cee794'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if table already exists
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rich_menus')"
    ))
    table_exists = result.scalar()

    if table_exists:
        return  # Table already exists, skip creation

    # Create enum type using raw SQL with IF NOT EXISTS logic
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE richmenustatus AS ENUM ('DRAFT', 'PUBLISHED', 'INACTIVE');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.create_table('rich_menus',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('chat_bar_text', sa.String(), nullable=False),
        sa.Column('line_rich_menu_id', sa.String(), nullable=True),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('image_path', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'PUBLISHED', 'INACTIVE', name='richmenustatus', create_constraint=False, native_enum=False), nullable=True, server_default='DRAFT'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rich_menus_id'), 'rich_menus', ['id'], unique=False)
    op.create_index(op.f('ix_rich_menus_line_rich_menu_id'), 'rich_menus', ['line_rich_menu_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_rich_menus_line_rich_menu_id'), table_name='rich_menus')
    op.drop_index(op.f('ix_rich_menus_id'), table_name='rich_menus')
    op.drop_table('rich_menus')
    
    # Drop the enum type
    sa.Enum(name='richmenustatus').drop(op.get_bind(), checkfirst=True)
