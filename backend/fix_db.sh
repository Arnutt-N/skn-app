#!/bin/bash
psql -U postgres -d skn_app -c "CREATE TABLE IF NOT EXISTS system_settings (id SERIAL PRIMARY KEY, key VARCHAR NOT NULL UNIQUE, value TEXT, description VARCHAR, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE);"
psql -U postgres -d skn_app -c "CREATE INDEX IF NOT EXISTS ix_system_settings_key ON system_settings (key);"
echo "Database table created."
