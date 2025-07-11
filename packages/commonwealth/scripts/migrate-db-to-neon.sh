#!/bin/bash

# Exit on any error
set -e

# this path is relative to the location from which the script is called i.e. /commonwealth root rather than the path
# from which the script exists i.e. commonwealth/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env';

if [[ -z "${BRANCH_NAME}" ]]; then
  BRANCH_NAME="production"
else
  BRANCH_NAME="${BRANCH_NAME}"
fi

DATABASE_NAME="commonwealth"
PROJECT_ID="${NEON_PROJECT_ID}"
ORG_ID="${NEON_ORG_ID}"

if [[ -z "${PROJECT_ID}" ]]; then
    echo "Error: NEON_PROJECT_ID is not set"
    exit 1
fi

if [[ -z "${ORG_ID}" ]]; then
    echo "Error: NEON_ORG_ID is not set"
    exit 1
fi

neon() {
   if [ -n "$PROJECT_ID" ]; then
       neonctl "$@" --org-id "$ORG_ID" --project-id "$PROJECT_ID"
   else
       neonctl "$@" --org-id "$ORG_ID"
   fi
}

echo "Checking if database '$DATABASE_NAME' exists on branch '$BRANCH_NAME'..."

if neon databases list --branch-name "$BRANCH_NAME" --output json | jq -r '.[].name' | grep -q "^${DATABASE_NAME}$"; then
   echo "Database '$DATABASE_NAME' found. Dropping it..."

   if neon databases delete "$DATABASE_NAME" --branch-name "$BRANCH_NAME"; then
       echo "Database dropped successfully."
   else
       echo "Failed to drop database. Exiting."
       exit 1
   fi
else
   echo "Database '$DATABASE_NAME' does not exist."
fi

echo "Creating database '$DATABASE_NAME'..."
if neon databases create --name "$DATABASE_NAME" --branch-name "$BRANCH_NAME"; then
   echo "Database '$DATABASE_NAME' created successfully."
else
   echo "Failed to create database."
   exit 1
fi

echo "Fetching database URI..."
DB_URL=$(neon connection-string --branch-name "$BRANCH_NAME" --database-name "$DATABASE_NAME")

# Check if dump file already exists
if [[ -f "dump_for_neon.sql" ]]; then
    echo "Found existing dump file: dump_for_neon.sql"
    read -p "Do you want to use the existing dump file? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Creating new dump from Heroku DB..."
        HEROKU_DB_URL=$(heroku config:get HEROKU_POSTGRESQL_MAROON_URL -a commonwealth-beta)
        if [[ -z "$HEROKU_DB_URL" ]]; then
            echo "Error: Failed to get Heroku database URL"
            exit 1
        fi

        pg_dump "$HEROKU_DB_URL" \
            --verbose \
            --no-privileges \
            --no-owner \
            --no-acl \
            -f dump_for_neon.sql
    else
        echo "Using existing dump file."
    fi
else
    echo "Dumping Heroku DB..."
    HEROKU_DB_URL=$(heroku config:get HEROKU_POSTGRESQL_MAROON_URL -a commonwealth-beta)
    if [[ -z "$HEROKU_DB_URL" ]]; then
        echo "Error: Failed to get Heroku database URL"
        exit 1
    fi

    pg_dump "$HEROKU_DB_URL" \
        --verbose \
        --no-privileges \
        --no-owner \
        --no-acl \
        -f dump_for_neon.sql
fi

echo "Uploading Heroku dump to Neon branch '$BRANCH_NAME' in database '$DATABASE_NAME'"

psql "$DB_URL" \
    --echo-queries \
    --file=dump_for_neon.sql \
    --single-transaction \
    --set ON_ERROR_STOP=on

echo "Upload complete!"

read -p "Do you want to delete the dump file? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f dump_for_neon.sql
    echo "Dump file deleted."
fi

