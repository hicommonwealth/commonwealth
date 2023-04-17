#!/bin/bash
# This script is used to start a local cosmos chain for testing purposes.

#set -x
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

export DEPLOY_ENV=heroku
# sh ${SCRIPT_DIR}/start.sh

PORT=5050
IMAGE_NAME=heroku-bin-csdk

cd $SCRIPT_DIR
docker build -t ${IMAGE_NAME} -f Dockerfile --no-cache .
docker run -p 5050:5050 -e PORT=${PORT} ${IMAGE_NAME}
  