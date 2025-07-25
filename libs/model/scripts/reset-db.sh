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

PROJECT_ID="${NEON_PROJECT_ID}"
ORG_ID="${NEON_ORG_ID}"

app=${1:-local}

# Set BRANCH_NAME according to the following precedence:
# 1. If app argument is explicitly set (not default 'local'), use it
# 2. Else, if USE_NEON_DEV_DB is set to true, use the dev branch name
# 3. Else, use 'local'
if [[ "$app" != "local" ]]; then
  BRANCH_NAME="$app"
elif [[ "$USE_NEON_DEV_DB" == "true" ]]; then
  BRANCH_NAME="dev-$(git config user.name)"
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
elif [ "$BRANCH_NAME" == "frick" ] || [ "$BRANCH_NAME" == "frack" ] || [ "$BRANCH_NAME" == "beta" ] || [ "$BRANCH_NAME" == "demo" ]; then
  if [[ -z "${PROJECT_ID}" ]]; then
      echo "Error: NEON_PROJECT_ID is not set"
      exit 1
  fi

  if [[ -z "${ORG_ID}" ]]; then
      echo "Error: NEON_ORG_ID is not set"
      exit 1
  fi

  echo "Resetting Neon branch '$BRANCH_NAME' from 'production' branch..."
  neonctl branches reset "$BRANCH_NAME" \
    --parent
  echo "Branch '$BRANCH_NAME' has been reset successfully."
elif [[ "$BRANCH_NAME" == "dev-$(git config user.name)" ]]; then
  # create a new branch from the production branch if it doesn't exist
  if ! neonctl branches list -o json | jq -e '.[] | select(.name == "'$BRANCH_NAME'")' > /dev/null; then
    echo "Branch '$BRANCH_NAME' does not exist. Creating it from 'production' branch..."
    neonctl branches create --name "$BRANCH_NAME" --parent "production" \
      --suspend-timeout 300 \
      --cu 0.25-1
    echo "Branch '$BRANCH_NAME' has been created successfully. There is no need to reset a new branch."
    # Fetch the new branch database connection string
    DB_URL=$(neon connection-string --branch-name "$BRANCH_NAME" --database-name commonwealth)
    echo "WARNING: You must add the following in your .env file: DATABASE_URL=$DB_URL"
  else
    echo "Branch '$BRANCH_NAME' already exists. Resetting it from 'production' branch..."
    neonctl branches reset "$BRANCH_NAME" \
      --parent
    echo "Branch '$BRANCH_NAME' has been reset successfully."
  fi
else
  echo "Invalid branch argument. Please use 'local', 'frick', 'frack', 'beta', 'demo' or 'dev-$(git config user.name)'"
fi
