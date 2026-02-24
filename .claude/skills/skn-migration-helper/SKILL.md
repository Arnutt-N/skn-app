---
name: skn-migration-helper
description: >
  Creates, applies, reviews, and debugs Alembic database migrations for the
  SKN App (JskApp) backend. Use when asked to "create migration", "migrate database",
  "add column", "run alembic", "fix migration", "สร้าง migration", "migrate",
  "เพิ่ม column", "แก้ไข database schema", "alembic error", "multiple heads",
  "migration stuck", "new model not detected", "revision not found".
  Do NOT use for query optimization, ORM relationship design, or FastAPI endpoints.
license: MIT
compatibility: >
  SKN App backend. Python 3.11+, Alembic, SQLAlchemy 2.0 async,
  PostgreSQL (asyncpg driver). Run from backend/ directory.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: devops
  tags: [alembic, migration, postgresql, database, sqlalchemy]
---

# skn-migration-helper

Manages Alembic database migrations for the SKN App — from adding a new model
to fixing stuck or conflicting migrations.

---

## CRITICAL: Project-Specific Rules

1. **Always run from `backend/`** — `alembic` commands must be run inside the `backend/` directory (where `alembic.ini` lives). Running from the project root will fail with "can't find config file".
2. **New models MUST be in `app/models/__init__.py`** — Alembic detects models via `import app.models` in `env.py`. If your model isn't imported there, autogenerate will never see it.
3. **`env.py` uses async engine** — the project uses `asyncio.run(run_async_migrations())`. Never replace with sync engine pattern. Never add sync `run_migrations_online()`.
4. **`DATABASE_URL` uses `asyncpg`** — the driver in `alembic.ini` is `postgresql+asyncpg://`. Never change to `psycopg2` or plain `postgresql://`.
5. **Review before applying** — autogenerate is not perfect. Always open the generated file and check for `op.drop_table` or missing `server_default`.
6. **Idempotent guards** — the project uses existence checks in `upgrade()` (`information_schema.tables`, `pg_indexes`). Use the same pattern when modifying existing tables.
7. **PostgreSQL enum changes** — adding a value to an existing enum requires `op.execute("ALTER TYPE myenum ADD VALUE IF NOT EXISTS 'new_val'")`. This must run OUTSIDE a transaction block on PostgreSQL < 12.
8. **Windows venv** — activate with `venv\Scripts\activate` on Windows, `source venv/bin/activate` on Linux/WSL.

---

## Context7 Docs

Context7 MCP is active. Use for Alembic op functions and SQLAlchemy column types.

| Library | Resolve Name | Key Topics |
|---|---|---|
| Alembic | `"alembic"` | op.add_column, op.create_table, alter_column, JSONB |
| SQLAlchemy | `"sqlalchemy"` | Column types, JSONB, UUID, async engine |

Usage: `mcp__context7__resolve-library-id libraryName="alembic"` →
`mcp__context7__get-library-docs context7CompatibleLibraryID="..." topic="add_column alter_column" tokens=5000`

---

## Architecture Overview

```
backend/
├── alembic.ini              ← config: script_location, sqlalchemy.url (dev hardcoded)
├── alembic/
│   ├── env.py               ← async engine setup; imports app.db.base.Base + app.models
│   ├── script.py.mako       ← migration file template
│   └── versions/            ← migration files (revision chain)
│       ├── a1b2c3d4_initial.py
│       └── g7h8i9j0k1l2_fix_chat_session_index.py  ← current HEAD
└── app/
    ├── db/
    │   ├── base.py          ← Base = declarative_base()
    │   └── session.py       ← engine, AsyncSessionLocal, get_db()
    └── models/
        ├── __init__.py      ← imports ALL models ← MUST UPDATE for new models
        ├── user.py
        ├── intent.py
        └── ...              ← 18+ model files
```

**Model registration chain:**
```
alembic/env.py
    └── import app.models          ← triggers __init__.py
            └── from .intent import IntentCategory, ...
                    └── class IntentCategory(Base)  ← registered with Base.metadata
```

---

## Step 1: Setup — Activate Venv and Navigate

Before any `alembic` command:

```bash
# Windows (Git Bash or CMD)
cd backend
source venv/Scripts/activate   # Git Bash
# or: venv\Scripts\activate    # CMD / PowerShell

# Linux / WSL
cd backend
source venv/bin/activate

# Verify alembic is available
alembic --version
```

**Check current state first:**
```bash
alembic current          # Current HEAD revision applied to DB
alembic history          # Full revision chain
alembic heads            # Should show exactly 1 head (multiple = conflict)
```

---

## Step 2: Standard Workflow — Add a New Model

Follow these 4 steps every time you add a new SQLAlchemy model:

### 2a. Create the model file

```python
# backend/app/models/new_feature.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class NewFeature(Base):
    __tablename__ = "new_features"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### 2b. Register in `app/models/__init__.py`

```python
# Add import — without this Alembic CANNOT detect the new table
from .new_feature import NewFeature
```

### 2c. Generate the migration

```bash
cd backend
alembic revision --autogenerate -m "add_new_features_table"
```

This creates `backend/alembic/versions/<revid>_add_new_features_table.py`.

### 2d. Review the generated file

Open it and verify:
- `op.create_table(...)` is present with the right columns
- No unexpected `op.drop_table(...)` entries
- Non-nullable columns on existing tables have `server_default`
- `down_revision` points to the current HEAD

Then apply:
```bash
alembic upgrade head
```

---

## Step 3: Common Column Type Patterns

Use these imports at the top of a migration file:

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
```

### Standard columns

```python
# In op.create_table() or op.add_column():
sa.Column('name', sa.String(), nullable=False)
sa.Column('title', sa.String(length=255), nullable=False)
sa.Column('count', sa.Integer(), nullable=False, server_default='0')
sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true')
sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
```

### PostgreSQL-specific columns (used in this project)

```python
# JSONB — used for IntentResponse.payload, ServiceRequest.details, etc.
sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True)

# UUID
sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False)

# ARRAY
sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True)
```

### Enum columns

```python
# Create enum type first, then use it
replytype = postgresql.ENUM(
    'text', 'flex', 'image', 'sticker', name='replytype', create_type=False
)
sa.Column('reply_type', replytype, nullable=False)
```

---

## Step 4: Idempotent Upgrade Pattern

The project guards upgrades with existence checks. Use this pattern when modifying
existing tables to avoid errors on DBs that were manually patched:

```python
def upgrade() -> None:
    conn = op.get_bind()

    # Guard: check if table already exists
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
        "WHERE table_name = :name)"
    ), {"name": "new_features"})
    if result.scalar():
        return  # Already applied — skip

    # Safe to create
    op.create_table('new_features', ...)


# Guard: check if column already exists before adding
def _column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns "
        "WHERE table_name = :t AND column_name = :c)"
    ), {"t": table, "c": column})
    return bool(result.scalar())

def upgrade() -> None:
    conn = op.get_bind()
    if not _column_exists(conn, "users", "new_column"):
        op.add_column("users", sa.Column("new_column", sa.String(), nullable=True))


# Guard: check if index exists
def _index_exists(conn, index_name: str) -> bool:
    result = conn.execute(
        sa.text("SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = :name)"),
        {"name": index_name},
    )
    return bool(result.scalar())
```

---

## Step 5: PostgreSQL Enum — Add a New Value

Alembic cannot autogenerate enum value additions. You must write this manually:

```python
def upgrade() -> None:
    # ADD VALUE IF NOT EXISTS prevents error if already added
    op.execute("ALTER TYPE replytype ADD VALUE IF NOT EXISTS 'carousel'")
    # Note: on PostgreSQL < 12, this cannot run inside a transaction.
    # Alembic wraps in a transaction by default — use with_autocommit if needed.

def downgrade() -> None:
    # PostgreSQL does NOT support removing enum values — this is a no-op
    pass
```

**Existing enum types in this project:**
- `replytype` — used by `AutoReply.reply_type` and `IntentResponse.reply_type`
- `matchtype` — `IntentKeyword.match_type`
- `chatmode` — `User.chat_mode` (BOT/HUMAN)
- `userrole` — `User.role`
- `sessionstatus` — `ChatSession.status`
- `closedby` — `ChatSession.closed_by`
- `messagedirection` — `Message.direction`

---

## Step 6: Data Migration Pattern

When a schema change requires backfilling existing rows:

```python
def upgrade() -> None:
    # Step 1: Add column nullable first
    op.add_column("service_requests", sa.Column(
        "priority", sa.String(length=20), nullable=True
    ))

    # Step 2: Backfill existing rows
    op.execute("UPDATE service_requests SET priority = 'NORMAL' WHERE priority IS NULL")

    # Step 3: Make non-nullable with server_default
    op.alter_column(
        "service_requests", "priority",
        existing_type=sa.String(length=20),
        nullable=False,
        server_default="NORMAL"
    )


def downgrade() -> None:
    op.drop_column("service_requests", "priority")
```

---

## Step 7: Rename Table or Column (Avoid Data Loss)

Autogenerate treats a rename as drop + create. Always use manual migration:

```python
def upgrade() -> None:
    # Rename table
    op.rename_table("old_table_name", "new_table_name")

    # Rename column (PostgreSQL: ALTER TABLE ... RENAME COLUMN)
    op.alter_column("my_table", "old_col_name", new_column_name="new_col_name")

    # Rename index
    op.execute("ALTER INDEX old_idx_name RENAME TO new_idx_name")


def downgrade() -> None:
    op.alter_column("my_table", "new_col_name", new_column_name="old_col_name")
    op.rename_table("new_table_name", "old_table_name")
```

---

## Common Issues

### "Can't find config file 'alembic.ini'"

**Cause:** Running `alembic` from the project root, not `backend/`.
**Fix:** `cd backend` first, then run alembic commands.

### "New model not detected — autogenerate produces no changes"

**Cause:** Model class not imported in `app/models/__init__.py`.
**Fix:** Add `from .your_model import YourModel` to `backend/app/models/__init__.py`.

### "Target database is not up to date" / "Multiple heads"

```bash
alembic heads   # Shows two or more head revisions
alembic merge heads -m "merge_branches"
alembic upgrade head
```

### "Connection refused" / "asyncpg.exceptions.ConnectionDoesNotExistError"

**Cause:** PostgreSQL is not running, or `DATABASE_URL` in `alembic.ini` is wrong.
**Fix:**
```bash
docker-compose up -d db    # Start PostgreSQL
# Or verify URL in alembic.ini: postgresql+asyncpg://user:pass@localhost:5432/dbname
```

### "Can't DROP column — table doesn't exist in downgrade"

**Cause:** Autogenerated `downgrade()` assumes a clean DB. If the table was already
there, downgrade may leave DB in broken state.
**Fix:** Wrap `downgrade()` with existence checks, same as `upgrade()`.

### "Can't autogenerate — env.py ImportError"

**Cause:** New model file has an import error (typo in model, circular import).
**Fix:** Test `python -c "import app.models"` from `backend/` with venv active.

### Enum "already exists" error on re-run

**Cause:** Using `sa.Enum('a','b', name='myenum')` without `create_type=False` in `op.create_table()`.
**Fix:** Add `create_type=False` to the `postgresql.ENUM(...)` definition if the enum already exists in DB.

### Migration "already applied" (revision not found in versions/)

**Cause:** `alembic_version` table in DB has a revision ID that no longer exists on disk.
```bash
# Check what DB thinks is current
alembic current

# Stamp DB to match an existing revision (use carefully)
alembic stamp <existing_revision_id>

# Then upgrade to head
alembic upgrade head
```

---

## Quality Checklist

Before committing a migration:

- [ ] Ran from `backend/` with venv active
- [ ] New model imported in `app/models/__init__.py` (if applicable)
- [ ] Generated file reviewed — no unexpected `op.drop_table()` or `op.drop_column()`
- [ ] Non-nullable columns on existing tables have `server_default`
- [ ] Idempotent guards used for modifications to existing tables
- [ ] `downgrade()` is correct and reversible (or explicitly a no-op with comment)
- [ ] `alembic upgrade head` succeeded on local DB
- [ ] `alembic downgrade -1` + `alembic upgrade head` cycle tested
- [ ] Migration file committed to git alongside model changes

---

*See `references/cheatsheet.md` for command quick-reference and `alembic.ini` / `env.py` snippets.*
