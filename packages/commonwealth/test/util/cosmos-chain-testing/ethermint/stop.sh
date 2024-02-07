#!/bin/bash
# This script is used to stop a local evmos chain for testing purposes.

set -x
IMAGE_NAME=evmos-dev
# docker force stop and remove the container but leave the image
docker stop ${IMAGE_NAME} && docker rm ${IMAGE_NAME} -f || trues