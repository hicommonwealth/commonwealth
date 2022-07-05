#!/bin/bash

# This script should ONLY be run if updating any image version on the server. This is meant to make it easy
# to match the versions of the tools used on the server and Heroku


# load environment variables from a local .env file
# https://stackoverflow.com/questions/19331497/set-environment-variables-from-file-of-key-value-pairs/30969768#30969768
# the -e option may need to be -E on Mac OS
# shellcheck disable=SC2046
export $(grep -v '^#' .env | xargs -d '\n' -e)

# check that all required ENV var were properly loaded into the environment
if [[ -z "$VULTR_IP" ]]; then
    echo "Must provide VULTR_IP in .env" 1>&2
    exit 1
    elif [[ -z "$VULTR_USER" ]]; then
      echo "Must provide VULTR_USER in .env" 1>&2
      exit 1
fi

echo "Connecting to $VULTR_USER@$VULTR_IP"
# connect to the Vultr server on which the images will be loaded
ssh root@"$VULTR_IP" /bin/bash << "EOF"
  echo "Connection Successful!"
  lsb_release -a

  # clears any existing rabbitmq and redis docker images
  docker rmi -f "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'rabbitmq')"
  docker rmi -f "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'redis')"

  # pull new docker images
  docker pull rabbitmq:3.10.5-management
  docker pull redis:6.2
EOF

