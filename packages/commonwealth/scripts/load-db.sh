#!/bin/bash


# this path is relative to the location from which the script is called i.e. /commonwealth root rather than the path
# from which the script exists i.e. commonwealth/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env';

if [[ -z "${PGPASSWORD}" ]]; then
  PGPASSWORD="edgeware"
else
  PGPASSWORD="${PGPASSWORD}"
fi

DUMP_NAME=latest.dump
if [ "$1" ]; then
  DUMP_NAME=$1
fi

psql -h localhost -d commonwealth -U commonwealth -f "$DUMP_NAME";
pnpm cancel-all-local-contests
