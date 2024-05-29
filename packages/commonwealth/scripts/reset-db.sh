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

app=${1:-local}

if [ "$app" == "local" ]; then
  psql -h localhost -d postgres -U commonwealth -c 'DROP DATABASE commonwealth WITH (FORCE);'; npx sequelize db:create
elif [ "$app" == "frick" ] || [ "$app" == "frack" ] || [ "$app" == "beta" ]; then
  heroku pg:copy commonwealth-beta::HEROKU_POSTGRESQL_MAROON_URL DATABASE_URL --app commonwealth-"$app" --confirm commonwealth-"$app"
else
  echo "Invalid app argument. Please use 'local', 'frick', 'frack', or 'beta'."
fi
