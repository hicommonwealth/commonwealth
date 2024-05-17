#!/bin/bash

# This script deletes all of the existing docker containers. For use only under extreme circumstances where a hard
# reset is required. Requires the private key to run.

# In order to avoid confusion, this script is not registered as a pnpm command therefore, to run this script the
# following command:
# chmod +rx ./scripts/delete-docker-containers.sh && VULTR_IP=XXXXXXXXX ./scripts/delete-docker-containers.sh


if [[ -z "$VULTR_IP" ]]; then
    echo "Must provide VULTR_IP in .env" 1>&2
    exit 1
fi

printf "Attempting to connect to root@%s\n" "$VULTR_IP"
ssh root@"$VULTR_IP" /bin/bash << "EOF"
  echo "Connection successful!"

  if [[ -z "$(docker ps -a -q)" ]]; then
    printf "There are no docker containers to delete!\n"
    exit 0
  fi

  docker stop $(docker ps -a -q)
  docker rm $(docker ps -a -q)

  echo "All containers successfully deleted!"
EOF
