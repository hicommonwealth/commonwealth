#!/bin/bash

DEFAULT_DB_URL='postgresql://commonwealth:edgeware@host.docker.internal:5432/commonwealth?sslmode=disable'

# Parse the argument or set default to local
ENVIRONMENT=${1:-local}

# Validate the argument
if [[ "$ENVIRONMENT" != "local" && "$ENVIRONMENT" != "frick" && "$ENVIRONMENT" != "frack" && "$ENVIRONMENT" != "beta" ]]; then
    echo "Error: Invalid argument. Accepted values are: local, frick, frack, or beta."
    exit 1
fi

# Determine the database URL based on the argument
if [ "$ENVIRONMENT" == "local" ]; then
    DATABASE_URL=$DEFAULT_DB_URL
else
    DATABASE_URL=$(heroku config:get DATABASE_URL -a commonwealth-"$ENVIRONMENT")
fi

# Function to check if docker can be run without sudo
can_run_docker_without_sudo() {
    docker info > /dev/null 2>&1
    return $?
}

# Function to run Docker with or without sudo
run_docker_command() {
    if can_run_docker_without_sudo; then
        docker "$@"
    else
        sudo docker "$@"
    fi
}

if [ "$ENVIRONMENT" == "local" ]; then
  # Check if psql exists
  if ! command -v psql &> /dev/null; then
      echo "psql could not be found. Initializing Postgres in Docker"
      DATABASE_URL="$DATABASE_URL" run_docker_command compose -f docker/monitoring.yaml -p load-testing up
  elif PGPASSWORD=edgeware psql -h localhost -U commonwealth -d commonwealth -c '\q' 2> /dev/null; then
      echo "Database is up and running. Skipping Docker DB initialization"
      DATABASE_URL="$DATABASE_URL" run_docker_command compose -f docker/monitoring-no-db.yaml -p load-testing up
  else
    echo "Database connection failed. Initializing Postgres in Docker"
    DATABASE_URL="$DATABASE_URL" run_docker_command compose -f docker/monitoring.yaml -p load-testing up
  fi
else
  echo "Connecting to remote database"
  DATABASE_URL="$DATABASE_URL" run_docker_command compose -f docker/monitoring.yaml -p load-testing up
fi