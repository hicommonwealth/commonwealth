#!/bin/bash

# Exit on any error
set -e

# this path is relative to the location from which the script is called i.e. /commonwealth root rather than the path
# from which the script exists i.e. commonwealth/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env';

if [[ -z "${PGPASSWORD}" ]]; then
  PGPASSWORD="edgeware"
else
  PGPASSWORD="${PGPASSWORD}"
fi

app=${1:-local}

# Set BRANCH_NAME according to the following precedence:
# 1. If app argument is explicitly set (not default 'local'), use it
# 2. If DATABASE_URL is not set or contains 'neon.tech', use the dev branch name
# 3. If DATABASE_URL contains '127.0.0.1', use 'local'
if [[ "$app" != "local" ]]; then
  BRANCH_NAME="$app"
elif [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
  BRANCH_NAME="dev-$(git config user.name)"
elif [[ "$DATABASE_URL" == *"127.0.0.1"* || "$DATABASE_URL" == *"localhost"* ]]; then
  BRANCH_NAME="local"
else
  BRANCH_NAME="local"
fi

# BRANCH_NAME cannot be 'production'
if [[ "$BRANCH_NAME" == "production" ]]; then
  echo "Error: BRANCH_NAME cannot be set to 'production'."
  exit 1
fi

if [ "$BRANCH_NAME" == "local" ]; then
  psql -h localhost -d postgres -U commonwealth -c 'DROP DATABASE IF EXISTS commonwealth WITH (FORCE);'; npx sequelize db:create
elif [ "$BRANCH_NAME" == "frick" ] || [ "$BRANCH_NAME" == "frack" ] || [ "$BRANCH_NAME" == "beta" ] || [ "$BRANCH_NAME" == "demo" ] || [ "$BRANCH_NAME" == "dev-$(git config user.name)" ]; then
  echo "Resetting Neon branch '$BRANCH_NAME' from 'production' branch..."
  neonctl branches reset "$BRANCH_NAME" \
    --parent
  echo "Branch '$BRANCH_NAME' has been reset successfully."
else
  echo "Invalid branch argument. Please use 'local', 'frick', 'frack', 'beta', 'demo' or 'dev-$(git config user.name)'"
fi
