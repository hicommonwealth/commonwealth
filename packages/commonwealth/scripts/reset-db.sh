#!/bin/bash


# this path is relative to the location from which the script is called i.e. /commonwealth root rather than the path
# from which the script exists i.e. commonwealth/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '.env';

if [[ -z "${PGPASSWORD}" ]]; then
  PGPASSWORD="edgeware"
else
  PGPASSWORD="${PGPASSWORD}"
fi

psql -h localhost -d postgres -U commonwealth -c 'DROP DATABASE commonwealth WITH (FORCE);'; npx sequelize db:create
