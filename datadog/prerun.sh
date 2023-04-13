#!/usr/bin/env bash

# This script is run before the Datadog Agent starts up. Required Postgres Dashboard configuration is set here.
# get environment variable key whose value starts with "postgres://datadog"
# this is the Heroku Postgres database URL
DATADOG_POSTGRES_URL=$(env | grep -E 'postgres://datadog' | head -n 1 | cut -d '=' -f 2)

# Update the Postgres configuration from above using the Heroku application environment variable
if [ -n "$DATADOG_POSTGRES_URL" ]; then
  echo "Updating Postgres configuration from Heroku environment variable"
  POSTGREGEX='^postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.*)$'
  if [[ $DATADOG_POSTGRES_URL =~ $POSTGREGEX ]]; then
    sed -i "s/<YOUR HOSTNAME>/${BASH_REMATCH[3]}/" "$DD_CONF_DIR/conf.d/postgres.d/conf.yaml"
    sed -i "s/<YOUR USERNAME>/${BASH_REMATCH[1]}/" "$DD_CONF_DIR/conf.d/postgres.d/conf.yaml"
    sed -i "s/<YOUR PASSWORD>/${BASH_REMATCH[2]}/" "$DD_CONF_DIR/conf.d/postgres.d/conf.yaml"
    sed -i "s/<YOUR PORT>/${BASH_REMATCH[4]}/" "$DD_CONF_DIR/conf.d/postgres.d/conf.yaml"
    sed -i "s/<YOUR DBNAME>/${BASH_REMATCH[5]}/" "$DD_CONF_DIR/conf.d/postgres.d/conf.yaml"
  fi
fi