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

if [ "$app" == "local" ]; then
  psql -h localhost -d postgres -U commonwealth -c 'DROP DATABASE commonwealth WITH (FORCE);'; npx sequelize db:create
elif [ "$app" == "frick" ] || [ "$app" == "frack" ] || [ "$app" == "beta" ] || [ "$app" == "demo" ]; then
  if [[ -z "${PROJECT_ID}" ]]; then
      echo "Error: NEON_PROJECT_ID is not set"
      exit 1
  fi

  if [[ -z "${ORG_ID}" ]]; then
      echo "Error: NEON_ORG_ID is not set"
      exit 1
  fi

  echo "Resetting Neon branch '$app' from 'production' branch..."
  neonctl branches reset "$app" \
    --parent \
    --project-id "$PROJECT_ID" \
    --org-id "$ORG_ID"
  echo "Branch '$app' has been reset successfully."
else
  echo "Invalid app argument. Please use 'local', 'frick', 'frack', 'beta' or 'demo'."
fi
