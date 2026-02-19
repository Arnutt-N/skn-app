"""add_request_comments_table

Revision ID: 9b29d6152718
Revises: g7h8i9j0k1l2
Create Date: 2026-02-19 08:59:14.208524

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b29d6152718'
down_revision: Union[str, Sequence[str], None] = 'g7h8i9j0k1l2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'request_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['request_id'], ['service_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_request_comments_id'), 'request_comments', ['id'], unique=False)
    op.create_index(op.f('ix_request_comments_request_id'), 'request_comments', ['request_id'], unique=False)
    op.create_index(op.f('ix_request_comments_user_id'), 'request_comments', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_request_comments_user_id'), table_name='request_comments')
    op.drop_index(op.f('ix_request_comments_request_id'), table_name='request_comments')
    op.drop_index(op.f('ix_request_comments_id'), table_name='request_comments')
    op.drop_table('request_comments')
