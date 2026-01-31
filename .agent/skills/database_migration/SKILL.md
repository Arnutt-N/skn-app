---
name: database-migration
description: Safe database schema evolution workflow using Alembic with SQLAlchemy for PostgreSQL.
---

# Database Migration (Alembic)

## 1. Migration Philosophy

- **Never modify production manually** — All schema changes must go through versioned migrations.
- **Version control migrations** — Commit all `*.py` files in `versions/` directory to Git.
- **Review before applying** — Autogenerate is not perfect; always inspect generated SQL.
- **Test locally first** — Run upgrade/downgrade cycle before committing.

## 2. Workflow Overview

```
Model Change → Generate Migration → Review Code → Test (up/down) → Apply to Staging → Deploy to Production
```

## 3. Common Commands

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "add_user_profile_table"

# Apply all pending migrations
alembic upgrade head

# Apply specific migration
alembic upgrade +1          # Upgrade 1 revision
alembic upgrade <revision>  # Upgrade to specific revision

# Downgrade
alembic downgrade -1        # Downgrade 1 revision
alembic downgrade <revision> # Downgrade to specific revision
alembic downgrade base      # Downgrade all (WARNING: data loss)

# Inspect current state
alembic current             # Show current revision
alembic history --verbose   # Show full history with dependencies
```

## 4. Autogenerate Best Practices

### 4.1 Inspect Differences First
```bash
# Check what Alembic detects before generating
alembic revision --autogenerate -m "change" --sql > migration_preview.sql
```

### 4.2 Review Generated Code
Always check the generated migration for:
- `op.drop_table()` — Dangerous if data exists
- Missing `server_default` for non-nullable columns on existing tables
- Incorrect type detection (e.g., `String` length changes)

```python
# Generated migration — add server_default for existing data
def upgrade():
    op.add_column('users', sa.Column('status', sa.String(), nullable=True))
    
    # Backfill existing rows
    op.execute("UPDATE users SET status = 'active'")
    
    # Then make non-nullable
    op.alter_column('users', 'status', nullable=False)
```

## 5. Manual Migration Scenarios

### 5.1 Complex Renames (Avoid Data Loss)
Autogenerate will drop/recreate. Use manual migration:

```python
def upgrade():
    # Rename table
    op.rename_table('old_table', 'new_table')
    
    # Rename column
    op.alter_column('new_table', 'old_column', new_column_name='new_column')

def downgrade():
    op.alter_column('new_table', 'new_column', new_column_name='old_column')
    op.rename_table('new_table', 'old_table')
```

### 5.2 Data Migration Pattern

```python
from alembic import op
import sqlalchemy as sa

# Revision identifiers
revision = 'abc123'
down_revision = 'xyz789'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add new column (nullable)
    op.add_column('orders', sa.Column('total_cents', sa.Integer(), nullable=True))
    
    # Step 2: Migrate data
    op.execute("""
        UPDATE orders 
        SET total_cents = CAST(total_dollars * 100 AS INTEGER)
    """)
    
    # Step 3: Make non-nullable
    op.alter_column('orders', 'total_cents', nullable=False)
    
    # Step 4: Drop old column
    op.drop_column('orders', 'total_dollars')


def downgrade():
    # Reverse the process
    op.add_column('orders', sa.Column('total_dollars', sa.Numeric(), nullable=True))
    op.execute("UPDATE orders SET total_dollars = total_cents / 100.0")
    op.alter_column('orders', 'total_dollars', nullable=False)
    op.drop_column('orders', 'total_cents')
```

## 6. Handling Migration Conflicts

### 6.1 Check for Multiple Heads
```bash
alembic history --verbose
# If you see multiple "heads", resolve before deploying
```

### 6.2 Merge Heads Pattern

```bash
# When two branches have migrations on same base
alembic merge -m "merge_heads" <revision1> <revision2>
```

Generated merge migration:
```python
# revision identifiers, used by Alembic
revision = 'merge_abc_xyz'
down_revision = ('abc123', 'xyz789')  # Tuple = merge point
branch_labels = None
depends_on = None


def upgrade():
    pass  # No schema changes, just merges lineage


def downgrade():
    pass
```

### 6.3 Rebase Strategy (Cleaner History)
If merge hasn't been applied anywhere:
```bash
# 1. Note current head revisions
alembic history

# 2. Delete one branch's migrations
rm alembic/versions/<revision_to_move>.py

# 3. Recreate on top of new head
alembic revision --autogenerate -m "recreate_on_new_base"
```

## 7. Production Deployment

### 7.1 Safe Deployment Order

```bash
# 1. Backup database first
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations BEFORE code deploy
alembic upgrade head

# 3. Verify migration applied
alembic current

# 4. Deploy application code
```

### 7.2 Zero-Downtime Patterns

```python
# Pattern: Add → Deploy → Remove
# Day 1: Add new column (nullable)
def upgrade():
    op.add_column('users', sa.Column('email_v2', sa.String(), nullable=True))

# Day 2: Application code writes to both columns
# Day 3: Backfill, make non-nullable
def upgrade():
    op.execute("UPDATE users SET email_v2 = email WHERE email_v2 IS NULL")
    op.alter_column('users', 'email_v2', nullable=False)

# Day 4: Application code reads from new column
# Day 5: Remove old column
def upgrade():
    op.drop_column('users', 'email')
```

## 8. Rollback Procedures

### 8.1 Immediate Rollback
```bash
# Check current revision
alembic current

# Downgrade one step
alembic downgrade -1

# Or downgrade to specific revision
alembic downgrade <previous_revision>
```

### 8.2 Backup Before Migration
```bash
#!/bin/bash
# pre_migration_backup.sh
set -e

DB_NAME="myapp"
BACKUP_FILE="backup_before_$(date +%Y%m%d_%H%M%S).sql"

echo "Creating backup: $BACKUP_FILE"
pg_dump -Fc $DB_NAME > "$BACKUP_FILE"

echo "Running migration..."
alembic upgrade head

echo "Backup saved to: $BACKUP_FILE"
```

## 9. Troubleshooting

### 9.1 Failed Migration (Partial Apply)
```bash
# Check current state
alembic current

# If stuck in middle, manually fix or:
# 1. Backup current state
# 2. Fix the migration script
# 3. Manually adjust alembic_version table if needed
```

### 9.2 Locked Tables
```sql
-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Terminate blocking process if safe
SELECT pg_terminate_backend(<pid>);
```

### 9.3 Migration Environment Issues
```bash
# Reset Alembic environment
alembic stamp head      # Mark current DB as at head (DANGEROUS)
alembic stamp <revision> # Mark as specific revision

# Regenerate from scratch (DEVELOPMENT ONLY)
alembic downgrade base
rm alembic/versions/*.py
alembic revision --autogenerate -m "initial"
```

## 10. Configuration Reference

```ini
# alembic.ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

[post_write_hooks]
hooks = ruff
ruff.type = exec
ruff.executable = ruff
ruff.options = format REVISION_SCRIPT_FILENAME
```

```python
# env.py — Key configuration
from app.core.config import settings

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata  # For autogenerate
```
