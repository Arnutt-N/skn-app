---
name: Database Standard (PostgreSQL)
description: Best practices for database schema design, naming conventions, and PostgreSQL specific features.
---

# Database Standard (PostgreSQL)

## 1. Naming Conventions (Snake Case)
- **Tables**: Plural, snake_case (e.g., `service_requests`, `users`).
- **Columns**: snake_case (e.g., `first_name`, `created_at`).
- **Primary Key**: `id` (BigInteger or UUID).
- **Foreign Key**: `target_table_singular_id` (e.g., `user_id`, `organization_id`).

## 2. Schema Design Best Practices

### 2.1 JSONB Usage
Use `JSONB` for data that is polymorphic, rapidly changing, or strictly document-oriented (like external form payloads).
- **Index specific keys** if you need to query them often.
- **Validation**: Enforce structure at the Application Layer (Pydantic).

```sql
-- Good use case: Service Request dynamic form details
CREATE TABLE service_requests (
    id BIGSERIAL PRIMARY KEY,
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexing a JSON path
CREATE INDEX idx_req_category ON service_requests ((details->>'category'));
```

### 2.2 Timestamps
Every table MUST have:
- `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
- `updated_at`: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` (Handled via Trigger or App logic)

### 2.3 Indexes
- Index all Foreign Keys (Postgres does not do this automatically).
- Index columns used frequently in `WHERE`, `ORDER BY`, or `JOIN` clauses.
- Use `Partial Indexes` for status flags (e.g., `WHERE status = 'PENDING'`).

## 3. Migration Workflow (Alembic)
- **Never** modify the database schema manually in production.
- **Commit** the generated migration scripts to Git.
- **Review** generated scripts before applying (Autogenerate is not perfect).

```bash
# Generate
alembic revision --autogenerate -m "add_service_request_table"

# Apply
alembic upgrade head
```

## 4. Data Integrity
- Use **ENUM** types for fixed sets of values (Status, Roles) to enforce data validity at the DB level.
- Use **Check Constraints** for simple validations (e.g., `price >= 0`).
- Cascade Deletes: Be careful. Prefer `SET NULL` or soft deletes (`is_deleted`) for important history.

## 5. Performance
- **Connection Pooling**: Use `pgbouncer` or internal pool (SQLAlchemy QueuePool).
- **N+1 Problem**: Always be mindful of eager loading (`selectinload`) vs lazy loading in SQLAlchemy.
- **Analyze**: Run `EXPLAIN ANALYZE` on slow queries.
