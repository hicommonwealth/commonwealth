#!/usr/bin/env bash

DD_CONF_DIR="/etc/datadog-agent"

# START OF CODE EXTRACTED FROM https://github.com/DataDog/heroku-buildpack-datadog/blob/master/extra/datadog.sh
# This code was extracted in order to maintain functionality when switching from
# Heroku Slugs to Docker container deployments.
export DATADOG_CONF="$DD_CONF_DIR/datadog.yaml"
export INTEGRATIONS_CONF="$DD_CONF_DIR/conf.d"
export POSTGRES_CONF="$INTEGRATIONS_CONF/postgres.d"
export REDIS_CONF="$INTEGRATIONS_CONF/redisdb.d"

# Get the lower case for the log level
DD_LOG_LEVEL_LOWER=$(echo "$DD_LOG_LEVEL" | tr '[:upper:]' '[:lower:]')

# Update the Datadog conf yaml to disable cloud provider metadata
sed -i -e"s|^.*cloud_provider_metadata:.*$|cloud_provider_metadata: []|" "$DATADOG_CONF"

DYNOHOST="$(hostname )"
DYNOTYPE=${DYNO%%.*}
DYNO_TAGS="dyno:$DYNO dynotype:$DYNOTYPE"

export DD_HOST_ALIASES="$DYNOHOST"

if [ -n "$HEROKU_APP_NAME" ]; then
  DYNO_TAGS="$DYNO_TAGS appname:$HEROKU_APP_NAME"
fi

if [ -z "$DD_API_KEY" ]; then
  echo "DD_API_KEY environment variable not set. Run: heroku config:add DD_API_KEY=<your API key>"
  DISABLE_DATADOG_AGENT=1
fi

if [ -z "$DD_HOSTNAME" ]; then
  if [ "$DD_DYNO_HOST" == "true" ]; then
    # Set the hostname to dyno name and ensure rfc1123 compliance.
    HAN="$(echo "$HEROKU_APP_NAME" | sed -e 's/[^a-zA-Z0-9-]/-/g' -e 's/^-//g')"
    if [ "$HAN" != "$HEROKU_APP_NAME" ]; then
      if [ "$DD_LOG_LEVEL_LOWER" == "debug" ]; then
        echo "WARNING: The appname \"$HEROKU_APP_NAME\" contains invalid characters. Using \"$HAN\" instead."
      fi
    fi

    D="$(echo "$DYNO" | sed -e 's/[^a-zA-Z0-9.-]/-/g' -e 's/^-//g')"
    export DD_HOSTNAME="$HAN.$D"
  else
    # Set the hostname to the dyno host
    DD_HOSTNAME="$(echo "$DYNOHOST" | sed -e 's/[^a-zA-Z0-9-]/-/g' -e 's/^-//g')"
    export DD_HOSTNAME
  fi
else
  # Generate a warning about DD_HOSTNAME deprecation.
  if [ "$DD_LOG_LEVEL_LOWER" == "debug" ]; then
    echo "WARNING: DD_HOSTNAME has been set. Setting this environment variable may result in metrics errors. To remove it, run: heroku config:unset DD_HOSTNAME"
  fi
fi

if [ "$DD_LOG_LEVEL_LOWER" == "debug" ]; then
  echo "[DEBUG] DD_HOSTNAME: $DD_HOSTNAME"
  echo "[DEBUG] DATADOG_CONF: $DATADOG_CONF"
  echo "[DEBUG] POSTGRES_CONF: $POSTGRES_CONF"
  echo "[DEBUG] REDIS_CONF: REDIS_CONF"
fi

# TODO: does this apply in Docker containers?
# Disable core checks (these read the host, not the dyno).
#if [ "$DD_DISABLE_HOST_METRICS" == "true" ]; then
#  find "$DD_CONF_DIR"/conf.d -name "conf.yaml.default" -exec mv {} {}_disabled \;
#fi

# Update the Postgres configuration from above using the Heroku application environment variable
if [ "$DD_LOG_LEVEL_LOWER" == "debug" ]; then
  echo "[DEBUG] DD_ENABLE_HEROKU_POSTGRES: $DD_ENABLE_HEROKU_POSTGRES"
fi
if [ "$DD_ENABLE_HEROKU_POSTGRES" == "true" ]; then
    # The default connection URL is set in DATABASE_URL, but can be configured by the user
    if [[ -z ${DD_POSTGRES_URL_VAR} ]]; then
      DD_POSTGRES_URL_VAR="DATABASE_URL"
    fi

  # Use a comma separator instead of new line
  IFS=","

  touch "$POSTGRES_CONF/conf.yaml"
  echo -e "init_config: \ninstances: \n" > "$POSTGRES_CONF/conf.yaml"

  echo "[DEBUG] Creating Datadog Postgres integration config..."
  for PG_URL in $DD_POSTGRES_URL_VAR
  do
    if [ -n "${!PG_URL}" ]; then
      POSTGREGEX='^postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.*)$'
      if [[ ${!PG_URL} =~ $POSTGREGEX ]]; then
        echo -e "  - host: ${BASH_REMATCH[3]}" >>  "$POSTGRES_CONF/conf.yaml"
        echo -e "    username: ${BASH_REMATCH[1]}" >> "$POSTGRES_CONF/conf.yaml"
        echo -e "    password: ${BASH_REMATCH[2]}" >> "$POSTGRES_CONF/conf.yaml"
        echo -e "    port: ${BASH_REMATCH[4]}" >> "$POSTGRES_CONF/conf.yaml"
        echo -e "    dbname: ${BASH_REMATCH[5]}" >> "$POSTGRES_CONF/conf.yaml"
        echo -e "    ssl: require" >> "$POSTGRES_CONF/conf.yaml"
        echo -e "    disable_generic_tags: false" >> "$POSTGRES_CONF/conf.yaml"
        if [ "$DD_ENABLE_DBM" == "true" ]; then
          echo -e "    dbm: true" >> "$POSTGRES_CONF/conf.yaml"
        fi
      fi
    fi
  done
  unset IFS
fi

# Update the Redis configuration from above using the Heroku application environment variable
if [ "$DD_LOG_LEVEL_LOWER" == "debug" ]; then
  echo "[DEBUG] DD_ENABLE_HEROKU_REDIS: $DD_ENABLE_HEROKU_REDIS"
fi
if [ "$DD_ENABLE_HEROKU_REDIS" == "true" ]; then

  # The default connection URL is set in REDIS_URL, but can be configured by the user
  if [[ -z ${DD_REDIS_URL_VAR} ]]; then
    DD_REDIS_URL_VAR="REDIS_URL"
  fi

  # Use a comma separator instead of new line
  IFS=","

  touch "$REDIS_CONF/conf.yaml"
  echo -e "init_config: \ninstances: \n" > "$REDIS_CONF/conf.yaml"

  for RD_URL in $DD_REDIS_URL_VAR
  do
    if [ -n "${!RD_URL}" ]; then
      REDISREGEX='^redis(s?)://([^:]*):([^@]+)@([^:]+):([^/]+)/?(.*)$'
      if [[ ${!RD_URL} =~ $REDISREGEX ]]; then
        echo -e "  - host: ${BASH_REMATCH[4]}" >> "$REDIS_CONF/conf.yaml"
        echo -e "    password: ${BASH_REMATCH[3]}" >> "$REDIS_CONF/conf.yaml"
        echo -e "    port: ${BASH_REMATCH[5]}" >> "$REDIS_CONF/conf.yaml"
        if [[ ! -z ${BASH_REMATCH[1]} ]]; then
          echo -e "    ssl: true" >> "$REDIS_CONF/conf.yaml"
          echo -e "    ssl_cert_reqs: 0" >> "$REDIS_CONF/conf.yaml"
        fi
        if [[ ! -z ${BASH_REMATCH[2]} ]]; then
          echo -e "    username: ${BASH_REMATCH[2]}" >> "$REDIS_CONF/conf.yaml"
        fi
        if [[ ! -z ${BASH_REMATCH[6]} ]]; then
          echo -e "    db: ${BASH_REMATCH[6]}" >> "$REDIS_CONF/conf.yaml"
        fi
      fi
    fi
  done
  unset IFS
fi

# Convert comma delimited tags from env vars to yaml
if [ -n "$DD_TAGS" ]; then
  DD_TAGS_NORMALIZED="$(sed "s/,[ ]\?/\ /g"  <<< "$DD_TAGS")"
  DD_TAGS="$DYNO_TAGS $DD_TAGS_NORMALIZED"
else
  DD_TAGS="$DYNO_TAGS"
fi

export DD_VERSION="$DD_VERSION"
export DD_TAGS="$DD_TAGS"
if [ "$DD_LOG_LEVEL_LOWER" == "debug" ]; then
  echo "[DEBUG] normalized tags: $DD_TAGS"
fi

export DD_HEROKU_DYNO="true"

# END OF EXTRACTED CODE

if [ -n "$DISABLE_DATADOG_AGENT" ]; then
  echo "The Datadog Agent has been disabled. Unset the DISABLE_DATADOG_AGENT or set missing environment variables."
else
  if [ "$APP_ENV" = "production" ] || [ "$ENABLE_DATADOG_AGENT" = "true" ]; then
    datadog-agent run &
    /opt/datadog-agent/embedded/bin/trace-agent --config=/etc/datadog-agent/datadog.yaml &
    /opt/datadog-agent/embedded/bin/process-agent --config=/etc/datadog-agent/datadog.yaml &
  fi
fi

# Check if a command is provided
if [ -z "$1" ]; then
  echo "Error: No command provided to run. Usage: $0 <your_command>"
  exit 1
fi

exec "$@"
