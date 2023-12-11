#!/bin/bash
# This script is used to start a local cosmos chain for testing purposes.

set -x
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

PORT=5050
IMAGE_NAME=csdk-beta

if [ "$1" = "--build" ]; then
    cd $SCRIPT_DIR
    docker build -t ${IMAGE_NAME} .
fi
docker run -d -p 5050:5050 -e PORT=${PORT} --name ${IMAGE_NAME} ${IMAGE_NAME}