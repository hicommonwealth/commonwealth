#!/bin/bash

# this path is relative to the location from which the script is called i.e. /load-testing root rather than the path
# from which the script exists i.e. load-testing/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env'

# Function to check if docker can be run without sudo
can_run_docker_without_sudo() {
  docker info >/dev/null 2>&1
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

print_usage() {
  echo "Usage: $0 <test_file_path> [options]"
  echo ""
  echo "Options:"
  echo "  -a <environment>  Set the application environment (local, frick, frack, beta). Default is 'local'."
  echo "  -c                Run tests in k6 cloud."
  echo "  -s <scenario>     Set the scenario (constant, spike, dev). Default is 'dev'."
  echo "  --help            Display this help message."
  exit 0
}

if [[ "$1" == "--help" ]]; then
  print_usage
fi

if [ -z "$1" ]; then
  echo "Usage: pnpm test-load test/<path_to_file>.spec.ts"
  exit 1
fi
TEST_FILEPATH=$1
shift # Remove the first argument (filepath) from the list

# Initialize variables with default values
APP_ENVIRONMENT="local"
CLOUD="false"
SCENARIO="dev"

# Parse options using getopts
while getopts "a:cs:" opt; do
  case ${opt} in
  a)
    APP_ENVIRONMENT=$OPTARG
    if [[ "$APP_ENVIRONMENT" != "local" && "$APP_ENVIRONMENT" != "frick" && "$APP_ENVIRONMENT" != "frack" && "$APP_ENVIRONMENT" != "beta" ]]; then
      echo "Error: Invalid argument. Accepted values are: local, frick, frack, or beta." 1>&2
      exit 1
    fi
    ;;
  c)
    CLOUD="true"
    ;;
  s)
    SCENARIO=$OPTARG
    if [[ "$SCENARIO" != "constant" && "$SCENARIO" != "spike" && "$SCENARIO" != "dev" ]]; then
      echo "Error: Invalid scenario. Accepted values are: constant, spike, or dev."
      exit 1
    fi
    ;;
  \?)
    echo "Invalid option: -$OPTARG" 1>&2
    exit 1
    ;;
  :)
    echo "Invalid option: $OPTARG requires an argument" 1>&2
    exit 1
    ;;
  esac
done
shift $((OPTIND - 1))

if [[ "$APP_ENVIRONMENT" = "local" && "$CLOUD" = "true" ]]; then
  echo "Error: cannot execute cloud tests against a local environment." 1>&2
  exit 1
fi

if [[ "$CLOUD" = "cloud" && "$SCENARIO" = "dev" ]]; then
  echo "Error: cannot execute dev scenario in k6 cloud," 1>&2
  exit 1
fi

echo "Configured Options = Cloud: $CLOUD - Scenario: $SCENARIO - App: $APP_ENVIRONMENT"

LOAD_TESTING_AUTH_TOKEN="testing"
if [[ "$APP_ENVIRONMENT" != "local" ]]; then
  LOAD_TESTING_AUTH_TOKEN=$(heroku config:get LOAD_TESTING_AUTH_TOKEN -a commonwealth-"$APP_ENVIRONMENT")
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
  if [ "$CLOUD" = "true" ]; then
    K6_CLOUD_PROJECT_ID=$K6_PROJECT_ID k6 cloud \
      -e SERVER_URL="$SERVER_URL" -e SCENARIO="$SCENARIO" -e LOAD_TESTING_AUTH_TOKEN="$LOAD_TESTING_AUTH_TOKEN" \
      --compatibility-mode=experimental_enhanced \
      "$TEST_FILEPATH"
  else
    K6_OUT=influxdb=http://localhost:8086/k6 k6 run \
      -e SERVER_URL="$SERVER_URL" -e SCENARIO="$SCENARIO" -e LOAD_TESTING_AUTH_TOKEN="$LOAD_TESTING_AUTH_TOKEN" \
      --compatibility-mode=experimental_enhanced \
      "$TEST_FILEPATH"
  fi

else
  echo "Running load tests using Docker k6 v0.52.0"
  if [ "$CLOUD" = "true" ]; then
    K6_DOCKER_CONTAINER_NAME="k6-docker"
    run_docker_command rm -f $K6_DOCKER_CONTAINER_NAME

    run_docker_command run --entrypoint /bin/sh -v "${PWD}"/test:/test --name $K6_DOCKER_CONTAINER_NAME -i grafana/k6:0.52.0-with-browser -c "
      k6 login cloud --token '${K6_CLOUD_PERSONAL_TOKEN}' &&
      K6_CLOUD_PROJECT_ID=$K6_PROJECT_ID k6 cloud \
        -e SERVER_URL='$SERVER_URL' -e SCENARIO='$SCENARIO' -e LOAD_TESTING_AUTH_TOKEN='$LOAD_TESTING_AUTH_TOKEN' \
        --compatibility-mode=experimental_enhanced \
        '/$TEST_FILEPATH'
    "
  else
    run_docker_command run --rm -v "${PWD}"/test:/test -i grafana/k6:0.52.0-with-browser run \
      -e SERVER_URL="$SERVER_URL" -e SCENARIO="$SCENARIO" -e LOAD_TESTING_AUTH_TOKEN="$LOAD_TESTING_AUTH_TOKEN" \
      -o influxdb=http://host.docker.internal:8086 \
      --compatibility-mode=experimental_enhanced \
      "/$TEST_FILEPATH"
  fi
fi

exit 0
