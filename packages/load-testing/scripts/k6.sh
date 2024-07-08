#!/bin/bash

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

if [ -z "$1" ]; then
    echo "Usage: pnpm test-load test/<path_to_file>.spec.ts"
    exit 1
fi


ENVIRONMENT=${2:-local}

if [[ "$ENVIRONMENT" != "local" && "$ENVIRONMENT" != "frick" && "$ENVIRONMENT" != "frack" && "$ENVIRONMENT" != "beta" ]]; then
    echo "Error: Invalid argument. Accepted values are: local, frick, frack, or beta."
    exit 1
fi

if [ "$ENVIRONMENT" == "local" ]; then
  if [ "$NATIVE_K6" ]; then
    SERVER_URL='http://localhost:8080'
  else
    SERVER_URL='http://host.docker.internal:8080'
  fi
else
    SERVER_URL=$(heroku config:get SERVER_URL -a commonwealth-"$ENVIRONMENT")
fi

if [ "$NATIVE_K6" ]; then
  K6_VERSION=$(k6 --version 2>&1)
  echo "Running tests using native $K6_VERSION"
  k6 run -e SERVER_URL="$SERVER_URL" --compatibility-mode=experimental_enhanced "$1"
else
  echo "Running load tests using Docker k6 v0.52.0"
  docker run --rm -v "${PWD}"/test:/test -i grafana/k6:0.52.0-with-browser run -e SERVER_URL="$SERVER_URL" --compatibility-mode=experimental_enhanced "$1"
fi

exit 0
