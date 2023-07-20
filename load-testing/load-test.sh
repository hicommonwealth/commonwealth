#!/bin/bash

# This script runs the load test and reports the results to DataDog.
# It requires the following environment variables to be set:
# - JWT: the JWT token to use for the load test
# - USER_ADDRESS: the user address to use for the load test
# - POST_THREAD_ID: the post thread ID to use for the load test
# - ENV: the environment to run the load test against (e.g. staging, production)
# - REPORT_DIR: the directory to store the load test report
# - DD_SITE: the DataDog site to report to (e.g. datadoghq.com, datadoghq.eu)
# - DD_API_KEY: the DataDog API key to use for reporting
# - DD_APP_KEY: the DataDog app key to use for reporting
# - TEST_LOCATION: the location to run the load test from (e.g. us-east-1, eu-west-1)
# - TEST_ID: the ID of the load test
# - TEST_NAME: the name of the load test
# Usage: ./load-test.sh

export SCRIPT_NAME=$(basename "$0")
export SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

if [[ -z "$SCRIPT_DIR" ]]; then
  export SCRIPT_DIR="."
fi

# if load file exists, source it
if [[ -f "${SCRIPT_DIR}/env.sh" ]]; then
  . ${SCRIPT_DIR}/env.sh
fi

export REPORT_DIR=${SCRIPT_DIR}/$REPORT_DIR
mkdir -p $REPORT_DIR

echo "Running load test with the following environment variables:"
env | grep -E 'JWT|USER_ADDRESS|POST_THREAD_ID|ENV|REPORT_DIR|DD_SITE|TEST_LOCATION|TEST_ID|TEST_NAME'

# start if DD_API_KEY and DD_APP_KEY are set
if [[ -n "$DD_API_KEY" && -n "$DD_APP_KEY" ]]; then 
  yarn --cwd ${SCRIPT_DIR} post:datadog &
fi

yarn --cwd ${SCRIPT_DIR} test:load
yarn --cwd ${SCRIPT_DIR} test:report