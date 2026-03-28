"""add source to service_request and archive fields to chat_session

Revision ID: aafd62b6dfa5
Revises: l2m3n4o5p6q7
Create Date: 2026-03-28 13:37:07.891249

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aafd62b6dfa5'
down_revision: Union[str, Sequence[str], None] = 'l2m3n4o5p6q7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add source to service_requests and archive fields to chat_sessions."""
    # service_requests: add source column with default 'LIFF' for existing rows
    op.add_column('service_requests', sa.Column('source', sa.String(length=20), nullable=False, server_default='LIFF'))
    op.create_index(op.f('ix_service_requests_source'), 'service_requests', ['source'], unique=False)

    # chat_sessions: add archive fields
    op.add_column('chat_sessions', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('chat_sessions', sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('chat_sessions', sa.Column('archived_by', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_chat_sessions_archived_by', 'chat_sessions', 'users', ['archived_by'], ['id'])


def downgrade() -> None:
    """Remove source and archive fields."""
    op.drop_constraint('fk_chat_sessions_archived_by', 'chat_sessions', type_='foreignkey')
    op.drop_column('chat_sessions', 'archived_by')
    op.drop_column('chat_sessions', 'archived_at')
    op.drop_column('chat_sessions', 'is_archived')

    op.drop_index(op.f('ix_service_requests_source'), table_name='service_requests')
    op.drop_column('service_requests', 'source')
