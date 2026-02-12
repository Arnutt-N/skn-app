"""add_live_chat_and_credentials

Revision ID: f1a2b3c4d5e6
Revises: e3f4g5h6i7j8
Create Date: 2026-01-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e3f4g5h6i7j8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Check if chat_sessions table already exists (indicates migration was already run)
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_sessions')"
    ))
    if result.scalar():
        return  # Tables already exist, skip creation

    # 1. Update users table (check if columns exist first)
    result = conn.execute(sa.text("""
        SELECT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'friend_status')
    """))
    if not result.scalar():
        op.add_column('users', sa.Column('friend_status', sa.String(), nullable=True, server_default='ACTIVE'))
        op.add_column('users', sa.Column('friend_since', sa.DateTime(timezone=True), nullable=True))
        op.add_column('users', sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True))

    # 2. Add HANDOFF to replytype enum
    # Note: PostgreSQL doesn't support adding values to enums inside a transaction easily in some versions,
    # but for migrations it's usually handled with op.execute
    op.execute("ALTER TYPE replytype ADD VALUE IF NOT EXISTS 'HANDOFF'")

    # 3. Create friend_events table
    op.create_table('friend_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('line_user_id', sa.String(length=50), nullable=False),
        sa.Column('event_type', sa.String(length=20), nullable=False),
        sa.Column('source', sa.String(length=20), nullable=True, server_default='WEBHOOK'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_friend_events_line_user_id'), 'friend_events', ['line_user_id'], unique=False)

    # 4. Create chat_sessions table
    op.create_table('chat_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('line_user_id', sa.String(length=50), nullable=False),
        sa.Column('operator_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='WAITING'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('claimed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('first_response_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('message_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('closed_by', sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(['operator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_sessions_line_user_id'), 'chat_sessions', ['line_user_id'], unique=False)

    # 5. Create chat_analytics table
    op.create_table('chat_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('operator_id', sa.Integer(), nullable=True),
        sa.Column('total_sessions', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('avg_response_time_seconds', sa.Integer(), nullable=True),
        sa.Column('avg_resolution_time_seconds', sa.Integer(), nullable=True),
        sa.Column('total_messages_sent', sa.Integer(), nullable=True, server_default='0'),
        sa.ForeignKeyConstraint(['operator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date', 'operator_id', name='uq_chat_analytics_date_operator')
    )
    op.create_index(op.f('ix_chat_analytics_date'), 'chat_analytics', ['date'], unique=False)

    # 6. Create credentials table
    op.create_table('credentials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('credentials', sa.Text(), nullable=False),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('is_default', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_credentials_provider'), 'credentials', ['provider'], unique=False)


def downgrade() -> None:
    op.drop_table('credentials')
    op.drop_table('chat_analytics')
    op.drop_table('chat_sessions')
    op.drop_table('friend_events')
    
    # We don't easily drop enum values in downgrade
    
    op.drop_column('users', 'last_message_at')
    op.drop_column('users', 'friend_since')
    op.drop_column('users', 'friend_status')
