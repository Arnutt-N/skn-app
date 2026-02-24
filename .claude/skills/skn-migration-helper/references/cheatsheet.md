# Migration Helper — Command Cheatsheet

Quick-reference for Alembic CLI, `alembic.ini`, and `env.py` snippets
specific to the SKN App backend.

---

## Alembic CLI Quick Reference

### Status & Inspection

```bash
# Check what revision is applied to the DB right now
alembic current

# Show full revision chain (oldest → newest)
alembic history

# Show just the latest revision(s) — should be exactly ONE
alembic heads

# Show pending revisions not yet applied
alembic history --indicate-current
```

### Generating Migrations

```bash
# Autogenerate from model changes (requires models registered in __init__.py)
alembic revision --autogenerate -m "add_users_table"

# Create an empty migration (write upgrade/downgrade manually)
alembic revision -m "manual_data_fix"
```

### Applying / Rolling Back

```bash
# Apply all pending migrations
alembic upgrade head

# Apply exactly N steps forward
alembic upgrade +1
alembic upgrade +2

# Roll back one step
alembic downgrade -1

# Roll back to a specific revision
alembic downgrade a1b2c3d4

# Roll back ALL migrations (empty DB schema)
alembic downgrade base
```

### Fix / Recovery

```bash
# Merge two conflicting heads into one
alembic merge heads -m "merge_branches"

# Stamp DB to a specific revision WITHOUT running migrations
# Use when DB was manually patched and is already up to date
alembic stamp head
alembic stamp <revision_id>

# Show SQL that WOULD be executed (dry run — does not touch DB)
alembic upgrade head --sql
alembic downgrade -1 --sql
```

---

## `alembic.ini` — Project Config

Location: `backend/alembic.ini`

```ini
[alembic]
# Migration files location (relative to alembic.ini)
script_location = %(here)s/alembic

# Hardcoded dev URL — asyncpg driver required
# NOTE: Production URL is injected in env.py via settings.DATABASE_URL
sqlalchemy.url = postgresql+asyncpg://postgres:password@localhost/skn_app_db

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic
```

**Key points:**
- `%(here)s` = directory containing `alembic.ini` = `backend/`
- Production URL is overridden in `env.py` via `settings.DATABASE_URL` (from `.env`)
- **Never change** `postgresql+asyncpg://` to `postgresql://` or `psycopg2` — this project uses async engine

---

## `alembic/env.py` — Project Pattern

The project uses an **async engine**. Never replace with the sync pattern.

```python
from logging.config import fileConfig
import asyncio

from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool

from alembic import context

# Import Base metadata — MUST import app.models to register all models
from app.db.base import Base
import app.models  # triggers app/models/__init__.py — registers ALL model classes

config = context.config
fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a real DB connection (generates SQL only)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Async migration runner — uses asyncpg driver."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

---

## `app/models/__init__.py` — Full Model Import List

Every model MUST appear here or Alembic will not detect schema changes.

```python
# backend/app/models/__init__.py

from .user import User
from .organization import Organization
from .service_request import ServiceRequest, ServiceStatus, ServiceCategory
from .message import Message, MessageDirection
from .chat_session import ChatSession, SessionStatus, ClosedBy
from .auto_reply import AutoReply
from .intent import IntentCategory, IntentKeyword, IntentResponse, MatchType, ReplyType
from .media import Media
from .credential import Credential
from .handoff_keyword import HandoffKeyword
from .canned_response import CannedResponse
from .system_config import SystemConfig
from .audit_log import AuditLog
from .business_hours import BusinessHours, BusinessHoursException
from .queue_position import QueuePosition
from .csat_survey import CSATSurvey

# ← Add new models here
# from .your_new_model import YourNewModel
```

---

## Migration File Template

Generated files look like this. Review before running `alembic upgrade head`.

```python
"""add_new_features_table

Revision ID: a1b2c3d4e5f6
Revises: g7h8i9j0k1l2
Create Date: 2026-02-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = 'a1b2c3d4e5f6'
down_revision = 'g7h8i9j0k1l2'   # ← must point to current HEAD before this migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # TODO: verify no unexpected op.drop_table() / op.drop_column() here
    op.create_table(
        'new_features',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_new_features_id'), 'new_features', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_new_features_id'), table_name='new_features')
    op.drop_table('new_features')
```

---

## Existing Enum Types in DB

These types already exist in PostgreSQL. Use `create_type=False` when referencing them:

```python
from sqlalchemy.dialects import postgresql

# Already in DB — do NOT let Alembic create them again
replytype    = postgresql.ENUM('text','flex','image','sticker','video','template','audio','location','imagemap', name='replytype',    create_type=False)
matchtype    = postgresql.ENUM('exact','contains','starts_with','regex',                                        name='matchtype',    create_type=False)
chatmode     = postgresql.ENUM('BOT','HUMAN',                                                                   name='chatmode',     create_type=False)
userrole     = postgresql.ENUM('SUPER_ADMIN','ADMIN','AGENT','USER',                                            name='userrole',     create_type=False)
sessionstatus= postgresql.ENUM('WAITING','ACTIVE','CLOSED',                                                     name='sessionstatus',create_type=False)
closedby     = postgresql.ENUM('OPERATOR','USER','SYSTEM','SYSTEM_TIMEOUT',                                     name='closedby',     create_type=False)
msgdirection = postgresql.ENUM('INCOMING','OUTGOING',                                                           name='messagedirection', create_type=False)
```

---

## Pre-commit Checklist (condensed)

```
□ Ran from backend/ with venv active
□ New model imported in app/models/__init__.py
□ Generated file reviewed — no unexpected drop_table / drop_column
□ Non-nullable columns on existing tables → server_default added
□ Idempotent guards used (information_schema / pg_indexes checks)
□ downgrade() is correct and reversible (or explicit no-op with comment)
□ alembic upgrade head succeeded
□ alembic downgrade -1 + alembic upgrade head cycle passed
□ Migration file committed alongside model changes
```
