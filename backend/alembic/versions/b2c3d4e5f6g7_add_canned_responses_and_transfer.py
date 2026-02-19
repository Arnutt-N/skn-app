"""add canned_responses table and transfer fields to chat_sessions

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Create canned_responses table if not exists
    result = conn.execute(sa.text("""
        SELECT EXISTS (SELECT 1 FROM information_schema.tables
        WHERE table_name = 'canned_responses')
    """))
    if not result.scalar():
        op.create_table(
            'canned_responses',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('shortcut', sa.String(30), unique=True, index=True, nullable=False),
            sa.Column('title', sa.String(100), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('category', sa.String(50), index=True),
            sa.Column('is_active', sa.Boolean(), server_default='true'),
            sa.Column('usage_count', sa.Integer(), server_default='0'),
            sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        )

    # 2. Add transfer_count to chat_sessions if not exists
    result = conn.execute(sa.text("""
        SELECT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_sessions' AND column_name = 'transfer_count')
    """))
    if not result.scalar():
        op.add_column('chat_sessions',
            sa.Column('transfer_count', sa.Integer(), server_default='0'))

    # 3. Add transfer_reason to chat_sessions if not exists
    result = conn.execute(sa.text("""
        SELECT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_sessions' AND column_name = 'transfer_reason')
    """))
    if not result.scalar():
        op.add_column('chat_sessions',
            sa.Column('transfer_reason', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('chat_sessions', 'transfer_reason')
    op.drop_column('chat_sessions', 'transfer_count')
    op.drop_table('canned_responses')
