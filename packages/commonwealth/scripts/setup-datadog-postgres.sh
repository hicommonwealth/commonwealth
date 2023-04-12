#!/bin/bash

# set -x
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

HEROKU_APP_NAME=$1
if [[ -z "$HEROKU_APP_NAME" ]]; then
  echo "Must provide Heroku app name as first argument" 1>&2
  exit 1
fi

# heroku DATABASE_URL Add-on name
HEROKU_APP_DATABASE=$(heroku pg:info DATABASE_URL -a ${HEROKU_APP_NAME}| grep -i 'Add-on:' | awk '{print $2}')

# create datadog credential
heroku pg:credentials:create --name datadog --app ${HEROKU_APP_NAME}

# check if datadog addon environment exists in app config
url_list=$(heroku pg:info -a ${HEROKU_APP_NAME} | head -n 1 | tr ',' '\n' | awk '{gsub(/=== /,""); print}' | awk '{$1=$1; print}')
found=false

for url_name in $url_list; do
  url_value=$(heroku config:get $url_name -a ${HEROKU_APP_NAME})
  if [[ $url_value == postgres://datadog* ]]; then
    found=true
    break
  fi
done

if ! $found; then
  echo "Datadog Add-on do not exists creating one"
  heroku addons:attach ${HEROKU_APP_DATABASE} --credential datadog -a ${HEROKU_APP_NAME}
else
  echo "Datadog Add-on exists"
fi

# run datadog postgres script
heroku pg:psql ${HEROKU_APP_DATABASE} -a ${HEROKU_APP_NAME} < ${SCRIPT_DIR}/datadog-postgres.sql