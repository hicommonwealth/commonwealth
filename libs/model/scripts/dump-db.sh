#!/bin/bash

set -e

# this path is relative to the location from which the script is called i.e. /libs/model rather than the path
# from which the script exists i.e. libs/model/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env';

dumpType=${1:-partial}
dumpName=${2:-latest.dump}

if [[ -z "${BRANCH_NAME}" ]]; then

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

echo "Creating temporary branch off production..."
TMP_BRANCH="dump-branch-$(date +%s)"
neon branches create --name "$TMP_BRANCH" --parent-branch-name "$BRANCH_NAME"
trap 'echo "Cleaning up branch $TMP_BRANCH..."; neon branches delete "$TMP_BRANCH" --force' EXIT

echo "Fetching database URI for branch $TMP_BRANCH..."
DB_URL=$(neon connection-string --branch-name "$TMP_BRANCH" --database-name "$DATABASE_NAME")

if [ "$dumpType" = "full" ]; then
    pg_dump "$DB_URL" --verbose --no-privileges --no-owner -f $dumpName
elif [ "$dumpType" = "partial" ]; then
    pg_dump "$DB_URL" --verbose \
        --exclude-table-data="public.\"Sessions\"" \
        --exclude-table-data="public.\"EmailUpdateTokens\"" \
        --exclude-table-data="public.\"Webhooks\"" \
        --exclude-table-data="public.\"ThreadVersionHistories\"" \
        --exclude-table-data="public.\"CommentVersionHistories\"" \
        --exclude-table-data-and-children="public.\"Outbox\"" \
        --no-privileges --no-owner \
        -f $dumpName
else
    dumpName=$dumpType
    pg_dump "$DB_URL" --verbose \
        --exclude-table-data="public.\"Sessions\"" \
        --exclude-table-data="public.\"EmailUpdateTokens\"" \
        --exclude-table-data="public.\"Webhooks\"" \
        --exclude-table-data="public.\"ThreadVersionHistories\"" \
        --exclude-table-data="public.\"CommentVersionHistories\"" \
        --exclude-table-data-and-children="public.\"Outbox\"" \
        --no-privileges --no-owner -f $dumpName
fi

echo "Dump complete. Cleaning up branch $TMP_BRANCH..."
# Branch cleanup is handled by the trap above