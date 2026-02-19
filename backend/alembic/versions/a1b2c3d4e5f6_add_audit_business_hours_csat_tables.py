"""add audit business_hours csat tables

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-02-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'cfac53729da9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Add last_activity_at to chat_sessions if not exists
    result = conn.execute(sa.text("""
        SELECT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_sessions' AND column_name = 'last_activity_at')
    """))
    if not result.scalar():
        op.add_column('chat_sessions', 
            sa.Column('last_activity_at', sa.DateTime(timezone=True), nullable=True))

    # 2. Create audit_logs table
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')"
    ))
    if not result.scalar():
        op.create_table('audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('admin_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(length=50), nullable=False),
            sa.Column('resource_type', sa.String(length=50), nullable=False),
            sa.Column('resource_id', sa.String(length=100), nullable=True),
            sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('ip_address', sa.String(length=50), nullable=True),
            sa.Column('user_agent', sa.String(length=500), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_audit_logs_admin_id'), 'audit_logs', ['admin_id'], unique=False)
        op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
        op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)

    # 3. Create business_hours table
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_hours')"
    ))
    if not result.scalar():
        op.create_table('business_hours',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('day_of_week', sa.Integer(), nullable=False),  # 0=Monday, 6=Sunday
            sa.Column('is_open', sa.Boolean(), nullable=True, server_default='true'),
            sa.Column('open_time', sa.String(length=5), nullable=False),  # HH:MM format
            sa.Column('close_time', sa.String(length=5), nullable=False),
            sa.Column('timezone', sa.String(length=50), nullable=True, server_default='Asia/Bangkok'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('day_of_week', name='uq_business_hours_day')
        )
        op.create_index(op.f('ix_business_hours_day'), 'business_hours', ['day_of_week'], unique=True)

        # Insert default business hours (Mon-Fri 08:00-17:00)
        for day in range(5):  # 0-4 = Monday to Friday
            conn.execute(sa.text(f"""
                INSERT INTO business_hours (day_of_week, is_open, open_time, close_time)
                VALUES ({day}, true, '08:00', '17:00')
                ON CONFLICT (day_of_week) DO NOTHING
            """))
        # Saturday, Sunday closed
        for day in range(5, 7):  # 5-6 = Saturday to Sunday
            conn.execute(sa.text(f"""
                INSERT INTO business_hours (day_of_week, is_open, open_time, close_time)
                VALUES ({day}, false, '08:00', '17:00')
                ON CONFLICT (day_of_week) DO NOTHING
            """))

    # 4. Create csat_responses table
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'csat_responses')"
    ))
    if not result.scalar():
        op.create_table('csat_responses',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('session_id', sa.Integer(), nullable=True),
            sa.Column('line_user_id', sa.String(length=50), nullable=False),
            sa.Column('score', sa.Integer(), nullable=False),
            sa.Column('feedback', sa.String(length=1000), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_csat_responses_session_id'), 'csat_responses', ['session_id'], unique=False)
        op.create_index(op.f('ix_csat_responses_line_user_id'), 'csat_responses', ['line_user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('csat_responses')
    op.drop_table('business_hours')
    op.drop_table('audit_logs')
    op.drop_column('chat_sessions', 'last_activity_at')
