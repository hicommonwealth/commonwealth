#!/bin/bash
# This script is used to start a local evmos chain for testing purposes.

set -x
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

PORT=5052
IMAGE_NAME=evmos-dev

if [ "$1" = "--build" ]; then
    cd $SCRIPT_DIR
    docker build -t ${IMAGE_NAME} .
fi
docker run -d -p 5052:5052 -e PORT=${PORT} --name ${IMAGE_NAME} ${IMAGE_NAME}