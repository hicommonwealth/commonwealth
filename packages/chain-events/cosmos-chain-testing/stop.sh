#!/bin/bash
# This script is used to stop a local cosmos test chain

# set -x
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

cd $SCRIPT_DIR/cosmos-sdk
# remove volume if you like by default we dont remove volumes
# rmi all will remove all images by default we dont remove images
# docker-compose down --remove-orphans --rmi all --timeout 0 --volumes
docker-compose down --remove-orphans