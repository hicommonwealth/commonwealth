#!/bin/bash

set -e

# this path is relative to the location from which the script is called i.e. /libs/model rather than the path
# from which the script exists i.e. libs/model/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env';

dumpType=${1:-partial}
dumpName=${2:-latest.dump}

NEON_DB_URL=${NEON_FOLLOWER_DB_URL}
if [ -z "$NEON_DB_URL" ]; then
    echo "Error: NEON_FOLLOWER_DB_URL environment variable is not set."
    exit 1
fi

if [ "$dumpType" = "full" ]; then
    pg_dump "$NEON_DB_URL" --verbose --no-privileges --no-owner -f $dumpName
elif [ "$dumpType" = "partial" ]; then
    pg_dump "$NEON_DB_URL" --verbose \
        --exclude-table-data="public.\"Sessions\"" \
        --exclude-table-data="public.\"EmailUpdateTokens\"" \
        --exclude-table-data="public.\"Webhooks\"" \
        --exclude-table-data="public.\"ThreadVersionHistories\"" \
        --exclude-table-data="public.\"CommentVersionHistories\"" \
        --exclude-table-data-and-children="public.\"Outbox\"" \
        --no-privileges --no-owner -f $dumpName
else
    dumpName=$dumpType
    pg_dump "$NEON_DB_URL" --verbose \
        --exclude-table-data="public.\"Sessions\"" \
        --exclude-table-data="public.\"EmailUpdateTokens\"" \
        --exclude-table-data="public.\"Webhooks\"" \
        --exclude-table-data="public.\"ThreadVersionHistories\"" \
        --exclude-table-data="public.\"CommentVersionHistories\"" \
        --exclude-table-data-and-children="public.\"Outbox\"" \
        --no-privileges --no-owner -f $dumpName
fi