#!/bin/bash
cd /home/arnutt-n/projects/skn-app/backend
source venv_linux/bin/activate
echo "Running alembic upgrade head..."
alembic upgrade head
echo "Verifying tables..."
psql -U postgres -d skn_app_db -c "\dt chat_sessions"
