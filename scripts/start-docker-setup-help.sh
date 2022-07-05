#!/bin/bash

# This script is meant to be run only once per project/repo clone when first setting up remote docker containers

printf "Welcome to docker setup help! Lets get you up and running!\n"

export $(grep -v '^#' .env | xargs -d '\n' -e)

if [[ "$UNIQUE_DOCKER_CONTAINER_ID" ]]; then
  printf "You're ahead of the game! Looks like you already have your UNIQUE_DOCKER_CONTAINER_ID variable set. Lets move on...\n\n"
else
  printf "First things first we need to define a new unique id variable in your .env file that will uniquely identify all of your docker containers.\n\n"
  # generate a random id
  RANDOM_ID=""
  chars=abcdefjhijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
  for i in {1..16}; do
    RANDOM_ID+="${chars:RANDOM%${#chars}:1}"
  done

  while [[ -z $UNIQUE_DOCKER_CONTAINER_ID ]]; do
    printf "Please add 'UNIQUE_DOCKER_CONTAINER_ID=%s' to your .env file\n\n" "$RANDOM_ID"
    # shellcheck disable=SC2162
    read -p "Press any key when you are finished"

    # shellcheck disable=SC2046
    export $(grep -v '^#' .env | xargs -d '\n' -e)

    if [[ -z "$UNIQUE_DOCKER_CONTAINER_ID" ]]; then
      printf "UNIQUE_DOCKER_CONTAINER_ID was not correctly set. Trying again...\n\n"
    fi
  done

  printf "Great job, UNIQUE_DOCKER_CONTAINER_ID was properly set!"
fi

printf "In order to spin up to the containers we need to be able to connect to the server.\n"

if [[ "$VULTR_IP" && "$VULTR_USER" && "$VULTR_DOCKER_ADMIN_PASSWORD" ]]; then
  printf "You already have VULTR_IP, VULTR_USER, and VULTR_DOCKER_ADMIN_PASSWORD environment variables set so we'll go right to testing the connection\n"
else
    printf "To connect to the server we need the IP address, user, and the password of the server\n"
    printf "You can get these values from a server admin\n"

    while [[ -z $VULTR_IP && -z $VULTR_USER ]]; do
      printf "Please add 'VULTR_IP=XXXXXX', 'VULTR_USER=XXXXXX', and 'VULTR_DOCKER_ADMIN_PASSWORD=XXXXXXXX' to your .env file\n\n"
      # shellcheck disable=SC2162
      read -p "Press any key when you are finished"

      # shellcheck disable=SC2046
      export $(grep -v '^#' .env | xargs -d '\n' -e)

      if [[ -z $VULTR_IP ]]; then
        printf "VULTR_IP was not properly set\n"
      fi
      if [[ -z $VULTR_USER ]]; then
        printf "VULTR_USER was not properly set\n"
      fi
      if [[ -z $VULTR_DOCKER_ADMIN_PASSWORD ]]; then
        printf "VULTR_USER was not properly set\n"
      fi
    done
fi

echo "Attempting to connect to $VULTR_USER@$VULTR_IP"
#ssh "$VULTR_USER"@"$VULTR_IP" /bin/bash << "EOF"
  echo "Connection Successful!"
  echo "Now that we're connected lets spin up some Docker containers for RabbitMQ and Redis"

  OPEN_RMQ_PORT=$(get_random_unused_port)
  OPEN_RMQ_MNGMT_PORT=$(get_random_unused_port)

  RMQ_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-RabbitMQ-$OPEN_RMQ_PORT-$OPEN_RMQ_MNGMT_PORT"
  # the docker container was never created i.e. first time running this script
  docker run "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'rabbitmq')" --name "$RMQ_CONTAINER_NAME" -d \
    -p $OPEN_RMQ_PORT:5672 -p $OPEN_RMQ_MNGMT_PORT:15672

  if [ "$(docker ps -q -f name="$RMQ_CONTAINER_NAME")" ]; then
    printf "A Docker container for RabbitMQ called '%s' is up and running!" "$RMQ_CONTAINER_NAME"
  else
    echo "WARNING: An unknown error occurred while creating and starting the RabbitMQ docker container. Please contact a server administrator"
    exit 1
  fi

  OPEN_REDIS_PORT=$(get_random_unused_port)
  REDIS_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-Redis-$OPEN_REDIS_PORT"

  docker run "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'redis')" --name "$REDIS_CONTAINER_NAME" -d \
    -p $OPEN_REDIS_PORT:6379

  if [ "$(docker ps -q -f name="$REDIS_CONTAINER_NAME")" ]; then
    printf "A Docker container for Redis called '%s' is up and running!" "$REDIS_CONTAINER_NAME"
  else
    echo "WARNING: An unknown error occurred while creating and starting the Redis docker container. Please contact a server administrator"
    exit 1
  fi

  echo "Your almost there! We just need to save a couple new environment variables to be able to easily connect in the future"

  printf "--------------------------------------------------------\n\n"
  printf "NOTE: Please add the following environment variables to your .env file to be able to connect in the future:\n\n"
  echo "VULTR_RABBITMQ_CONTAINER_PORT=$OPEN_RMQ_PORT"
  echo "VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT=$OPEN_RMQ_MNGMT_PORT"
  printf "VULTR_REDIS_CONTAINER_PORT=%s\n\n" "$OPEN_REDIS_PORT"
  echo "--------------------------------------------------------"

  echo "Thats it! Next time you want to use your remote containers please start them up using"
  echo "'yarn start-containers' and shut them down at the end of the day with 'yarn shutdown-containers'"
  echo "Were all done. Good luck out there!"
EOF






