#!/bin/bash

set -e

# this path is relative to the location from which the script is called i.e. /commonwealth root rather than the path
# from which the script exists i.e. commonwealth/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env';

dumpName=${1:-latest.dump}

pnpm reset-db

if [[ -z "$DATABASE_URL" || "$DATABASE_URL" == *"127.0.0.1"* || "$DATABASE_URL" == *"localhost"* ]]; then
  pnpm load-db $dumpName
else
  echo "DATABASE_URL is not local, skipping pnpm load-db $dumpName"
fi
pnpm migrate-db

# remove production noise
pnpm cancel-active-contests