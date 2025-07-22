#!/bin/bash
set -e

# Create commonwealth user and DB
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE USER commonwealth WITH PASSWORD 'commonwealth';
  CREATE DATABASE commonwealth OWNER commonwealth;
EOSQL

# Import SQL dump
psql -v ON_ERROR_STOP=1 --username "commonwealth" --dbname "commonwealth" -f /docker-entrypoint-initdb.d/latest.dump.sql

# Run Sequelize migrations using Node runtime
cd /app

# You can adjust this to use env vars or CLI flags
DATABASE_URL="postgres://commonwealth:commonwealth@localhost:5432/commonwealth" \
  npx sequelize-cli db:migrate