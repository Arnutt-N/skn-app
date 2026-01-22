"""add_intent_tables_manual

Revision ID: 8a9b1c2d3e4f
Revises: cd2257cee794
Create Date: 2026-01-17 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8a9b1c2d3e4f'
down_revision: Union[str, None] = 'cd2257cee794'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create intent_categories table
    op.create_table(
        'intent_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_intent_categories_id'), 'intent_categories', ['id'], unique=False)
    op.create_index(op.f('ix_intent_categories_name'), 'intent_categories', ['name'], unique=False)

    # Create intent_keywords table (using existing matchtype enum)
    op.create_table(
        'intent_keywords',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('keyword', sa.String(), nullable=False),
        sa.Column('match_type', sa.Enum('EXACT', 'CONTAINS', 'REGEX', 'STARTS_WITH', name='matchtype', create_type=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['intent_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_intent_keywords_id'), 'intent_keywords', ['id'], unique=False)
    op.create_index(op.f('ix_intent_keywords_keyword'), 'intent_keywords', ['keyword'], unique=False)

    # Create intent_responses table (using existing replytype enum)
    op.create_table(
        'intent_responses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('reply_type', sa.Enum('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'LOCATION', 'STICKER', 'FLEX', 'TEMPLATE', 'IMAGEMAP', name='replytype', create_type=False), nullable=False),
        sa.Column('text_content', sa.Text(), nullable=True),
        sa.Column('media_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['intent_categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_intent_responses_id'), 'intent_responses', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_intent_responses_id'), table_name='intent_responses')
    op.drop_table('intent_responses')
    op.drop_index(op.f('ix_intent_keywords_keyword'), table_name='intent_keywords')
    op.drop_index(op.f('ix_intent_keywords_id'), table_name='intent_keywords')
    op.drop_table('intent_keywords')
    op.drop_index(op.f('ix_intent_categories_name'), table_name='intent_categories')
    op.drop_index(op.f('ix_intent_categories_id'), table_name='intent_categories')
    op.drop_table('intent_categories')
