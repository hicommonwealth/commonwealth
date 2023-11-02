#!/bin/bash
# This script is used to start a local cosmos chain for testing purposes.

set -x
IMAGE_NAME=csdk-v1
# docker force stop and remove the container but leave the image
docker stop ${IMAGE_NAME} && docker rm ${IMAGE_NAME} -f || true