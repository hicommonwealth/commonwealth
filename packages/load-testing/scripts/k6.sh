#!/bin/bash

# this path is relative to the location from which the script is called i.e. /load-testing root rather than the path
# from which the script exists i.e. load-testing/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env';

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


APP_ENVIRONMENT=${2:-local}
CLOUD=${3:-false}

if [[ "$APP_ENVIRONMENT" != "local" && "$APP_ENVIRONMENT" != "frick" && "$APP_ENVIRONMENT" != "frack" && "$APP_ENVIRONMENT" != "beta" ]]; then
    echo "Error: Invalid argument. Accepted values are: local, frick, frack, or beta."
    exit 1
fi

if [[ "$APP_ENVIRONMENT" = "local" && "$CLOUD" = "cloud" ]]; then
  echo "Error: cannot execute cloud tests against a local environment."
  exit 1
fi

K6_PROJECT_ID=3704072
if [[ "$CLOUD" = "cloud" ]]; then
  if [[ "$APP_ENVIRONMENT" = "frick" ]]; then
    K6_PROJECT_ID=3704080
  elif [[ "$APP_ENVIRONMENT" = "frack" ]]; then
    K6_PROJECT_ID=3704090
  elif [[ "$APP_ENVIRONMENT" = "beta" ]]; then
    K6_PROJECT_ID=3704091
  fi
fi


if [ "$APP_ENVIRONMENT" == "local" ]; then
  if [ "$NATIVE_K6" ]; then
    SERVER_URL='http://localhost:8080'
  else
    SERVER_URL='http://host.docker.internal:8080'
  fi
else
    SERVER_URL=$(heroku config:get SERVER_URL -a commonwealth-"$APP_ENVIRONMENT")
fi

if [ "$NATIVE_K6" ]; then
  K6_VERSION=$(k6 --version 2>&1)
  echo "Running tests using native $K6_VERSION"
  if [ "$CLOUD" = "cloud" ]; then
    K6_CLOUD_PROJECT_ID=$K6_PROJECT_ID k6 cloud -e SERVER_URL="$SERVER_URL" --compatibility-mode=experimental_enhanced "$1"
  else
    K6_OUT=influxdb=http://localhost:8086/k6 k6 run -e SERVER_URL="$SERVER_URL" --compatibility-mode=experimental_enhanced "$1"
  fi

else
  echo "Running load tests using Docker k6 v0.52.0"
  if [ "$CLOUD" = "cloud" ]; then
    K6_DOCKER_CONTAINER_NAME="k6-docker"
    run_docker_command rm -f $K6_DOCKER_CONTAINER_NAME

    run_docker_command run --entrypoint /bin/sh -v "${PWD}"/test:/test --name $K6_DOCKER_CONTAINER_NAME -i grafana/k6:0.52.0-with-browser -c "
      k6 login cloud --token '${K6_CLOUD_PERSONAL_TOKEN}' &&
      K6_CLOUD_PROJECT_ID=$K6_PROJECT_ID k6 cloud -e SERVER_URL='$SERVER_URL' --compatibility-mode=experimental_enhanced '/$1'
    "
  else
    run_docker_command run --rm -v "${PWD}"/test:/test -i grafana/k6:0.52.0-with-browser run -e SERVER_URL="$SERVER_URL" -o influxdb=http://host.docker.internal:8086 --compatibility-mode=experimental_enhanced "/$1"
  fi
fi

exit 0
