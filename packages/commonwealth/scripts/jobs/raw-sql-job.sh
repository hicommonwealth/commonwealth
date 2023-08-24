#!/bin/bash

SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

if [[ -z "$DATABASE_URL" ]]; then
    echo "using default DATABASE_URL"
    DATABASE_URL=postgres://commonwealth:edgeware@localhost:5432/commonwealth
fi

psql $DATABASE_URL < ${SCRIPT_DIR}/${1}