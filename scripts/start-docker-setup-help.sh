#!/bin/bash

# This script is meant to be run only once per project/repo clone when first setting up remote docker containers

printf "Welcome to docker setup help! Lets get you up and running!\n"

export $(grep -v '^#' .env | xargs -d '\n' -e)
sleep 1

if [[ "$VULTR_RABBITMQ_CONTAINER_PORT" && "$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT" && "$VULTR_REDIS_CONTAINER_PORT" ]]; then
  echo "It looks like you have already run this script before. Please run 'yarn start-containers' instead."
  exit 0
fi

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

  sleep 1
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

  printf "Great job, UNIQUE_DOCKER_CONTAINER_ID was properly set!\n\n"
fi
sleep 1
printf "In order to spin up to the containers we need to be able to connect to the server.\n"
sleep 1
if [[ "$VULTR_IP" && "$VULTR_USER" && "$VULTR_DOCKER_ADMIN_PASSWORD" ]]; then
  printf "You already have VULTR_IP, VULTR_USER, and VULTR_DOCKER_ADMIN_PASSWORD environment variables set so we'll go right to testing the connection\n"
else
    sleep 1
    printf "To connect to the server we need the IP address, user, and the password of the server\n"
    printf "You can get these values from a server admin\n"
    sleep 1
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

sleep 1
printf "\nAttempting to connect to %s@%s\n" "$VULTR_USER" "$VULTR_IP"
ssh "$VULTR_USER"@"$VULTR_IP" UNIQUE_DOCKER_CONTAINER_ID="$UNIQUE_DOCKER_CONTAINER_ID" /bin/bash << "EOF"
  printf "Connection Successful!\n\n"

  # function that returns a randomly chosen open port
  function get_random_unused_port {
     (netstat --listening --all --tcp --numeric |
      sed '1,2d; s/[^[:space:]]*[[:space:]]*[^[:space:]]*[[:space:]]*[^[:space:]]*[[:space:]]*[^[:space:]]*:\([0-9]*\)[[:space:]]*.*/\1/g' |
      sort -n | uniq; seq 1 1000; seq 1 65535
      ) | sort -n | uniq -u | shuf -n 1
  }

  echo "Now that we're connected lets spin up some Docker containers for RabbitMQ and Redis"

  OPEN_RMQ_PORT=$(get_random_unused_port)
  OPEN_RMQ_MNGMT_PORT=$(get_random_unused_port)

  RMQ_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-RabbitMQ-$OPEN_RMQ_PORT-$OPEN_RMQ_MNGMT_PORT"
  # the docker container was never created i.e. first time running this script
  docker run --name "$RMQ_CONTAINER_NAME" -d -p $OPEN_RMQ_PORT:5672 -p $OPEN_RMQ_MNGMT_PORT:15672 \
    "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'rabbitmq')"

  sleep 1
  if [ "$(docker ps -q -f name="$RMQ_CONTAINER_NAME")" ]; then
    printf "A Docker container for RabbitMQ called '%s' is up and running\n" "$RMQ_CONTAINER_NAME"
  else
    printf "WARNING: An unknown error occurred while creating and starting the RabbitMQ docker container. Please contact a server administrator\n"
    exit 1
  fi

  OPEN_REDIS_PORT=$(get_random_unused_port)
  REDIS_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-Redis-$OPEN_REDIS_PORT"

  docker run --name "$REDIS_CONTAINER_NAME" -d -p $OPEN_REDIS_PORT:6379 \
    "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'redis')"

  if [ "$(docker ps -q -f name="$REDIS_CONTAINER_NAME")" ]; then
    printf "A Docker container for Redis called '%s' is up and running!\n" "$REDIS_CONTAINER_NAME"
  else
    echo "WARNING: An unknown error occurred while creating and starting the Redis docker container. Please contact a server administrator\n"
    exit 1
  fi

  printf "\n"
  echo "Your almost there! We just need to save a couple new environment variables to be able to easily connect in the future"

  printf "\n*******************************************************\n\n"
  printf "NOTE: Please add the following environment variables to your .env file to be able to connect in the future:\n\n"
  echo "VULTR_RABBITMQ_CONTAINER_PORT=$OPEN_RMQ_PORT"
  echo "VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT=$OPEN_RMQ_MNGMT_PORT"
  printf "VULTR_REDIS_CONTAINER_PORT=%s\n\n" "$OPEN_REDIS_PORT"
  printf "*******************************************************\n\n"

  echo "That's it! Your docker containers are currently running."
  echo "When you are done using your containers you should shut them down using 'yarn shutdown-containers'"
  echo "The next time you want to use your remote containers, start them up using 'yarn start-containers'"
  printf "\n\n"
  echo "We're all done. Good luck out there!"
EOF






