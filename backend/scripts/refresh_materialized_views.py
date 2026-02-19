"""Refresh materialized views used by analytics.

Usage:
  python scripts/refresh_materialized_views.py
  python scripts/refresh_materialized_views.py --no-concurrently

Notes:
  - Default uses CONCURRENTLY for near-zero read downtime.
  - CONCURRENTLY requires a unique index on the materialized view.
  - For future very large datasets (10M+ messages), prefer table partitioning.
"""
import argparse
import asyncio

from sqlalchemy import text

from app.db.session import engine


async def refresh_daily_message_stats(concurrently: bool = True) -> None:
    clause = "CONCURRENTLY " if concurrently else ""
    sql = text(f"REFRESH MATERIALIZED VIEW {clause}daily_message_stats")
    async with engine.connect() as conn:
        autocommit_conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        await autocommit_conn.execute(sql)


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh analytics materialized views.")
    parser.add_argument(
        "--no-concurrently",
        action="store_true",
        help="Use blocking refresh mode instead of CONCURRENTLY.",
    )
    args = parser.parse_args()
    asyncio.run(refresh_daily_message_stats(concurrently=not args.no_concurrently))


if __name__ == "__main__":
    main()
