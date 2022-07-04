#!/bin/bash

# NOTE: If server load becomes too high refactor the Docker file to run RabbitMQ and Redis on the same container rather
# than on individual containers.

# Using UNIQUE_DOCKER_CONTAINER_ID prevents accidentally utilizing the existing docker container of another user

# An extremely rare race condition may occur where by the time this script launches the container the port is in use
# by another container spun up by another script running almost simultaneously. Since this scenario is so rare (occurs
# only if two different people from Commonwealth run this script at the exact same time and the script selects the exact
# same randomly chose open port i.e. extremely low probability of occurring) it is not handled and you should simply
# restart the script to let it find an available port once again.

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
    elif [[ -z "$VULTR_DOCKER_ADMIN_PASSWORD" ]]; then
      echo "Must provide VULTR_DOCKER_ADMIN_PASSWORD in .env" 1>&2
      exit 1
    elif [[ -z "$VULTR_RABBITMQ_CONTAINER_PORT" ]]; then
      echo "Must provide VULTR_RABBITMQ_CONTAINER_PORT in .env" 1>&2
      exit 1
    elif [[ -z "$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT" ]]; then
      echo "Must provide VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT in .env" 1>&2
      exit 1
    elif [[ -z "$UNIQUE_DOCKER_CONTAINER_ID" ]]; then
      echo "Must provide UNIQUE_DOCKER_CONTAINER_ID in .env" 1>&2
      exit 1
    elif [[ -z "$VULTR_REDIS_CONTAINER_PORT" ]]; then
      echo "Must provide VULTR_REDIS_CONTAINER_PORT in .env" 1>&2
      exit 1
fi

echo "Connecting to $VULTR_USER@$VULTR_IP"
# connect to the Vultr server on which the images will be loaded
#ssh "$VULTR_USER"@"$VULTR_IP" /bin/bash << "EOF"
echo "Connection Successful!"

# function that returns a randomly chosen open port
function get_random_unused_port {
   (netstat --listening --all --tcp --numeric |
    sed '1,2d; s/[^[:space:]]*[[:space:]]*[^[:space:]]*[[:space:]]*[^[:space:]]*[[:space:]]*[^[:space:]]*:\([0-9]*\)[[:space:]]*.*/\1/g' |
    sort -n | uniq; seq 1 1000; seq 1 65535
    ) | sort -n | uniq -u | shuf -n 1
}

# This section deals with the Docker container port mappings. Inside each container RabbitMQ and Redis will always
# run on their default ports but we must map these ports to unique external ports such that each container has a unique
# URL. For example one RabbitMQ instance could be accessed via $VULTR_IP:6060 and another via $VULTR_IP:6061
# The script first attempts to use the ports defined in the .env file. If any of these ports are unavailable the script
# selects an open port at random and gives a warning to the user saying they need to update the env variable in their
# .env file.

# ------------------------ RabbitMQ -----------------------------------
# RabbitMQ AQMP (queue service)
RMQ_PORT_NOT_AVAILABLE=$(sudo --prompt="" -S -- "lsof -i:$VULTR_RABBITMQ_CONTAINER_PORT" <<< "$VULTR_DOCKER_ADMIN_PASSWORD")
if [[ -z "$RMQ_PORT_NOT_AVAILABLE" ]]; then
  # The given RabbitMQ port is available
  printf "--------------------------------\nThe given RabbitMQ port %s is available!\n" "$VULTR_RABBITMQ_CONTAINER_PORT"
  OPEN_RMQ_PORT=$VULTR_RABBITMQ_CONTAINER_PORT
else
  # The given RabbitMQ port is unavailable
  printf "WARNING: The given RabbitMQ port %s is not available!\nSearching for an open port...\n" "$VULTR_RABBITMQ_CONTAINER_PORT"
  OPEN_RMQ_PORT=$(get_random_unused_port)
  printf "Open port found: %s\n PLEASE COPY THIS PORT TO THE - VULTR_RABBITMQ_CONTAINER_PORT ENV VAR\n" \
    "--------------------------------\n" "$OPEN_RMQ_PORT"
fi

# RabbitMQ Management plugin
RMQ_MNGMT_PORT_NOT_AVAILABLE=$(sudo --prompt="" -S -- "lsof -i:$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT" <<< "$VULTR_DOCKER_ADMIN_PASSWORD")
if [[ -z "$RMQ_MNGMT_PORT_NOT_AVAILABLE" ]]; then
  printf "--------------------------------\nThe given RabbitMQ port %s is available!\n" "$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT"
  OPEN_RMQ_MNGMT_PORT=$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT
else
  printf "WARNING: The given RabbitMQ port %s is not available!\nSearching for an open port...\n" "$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT"
  OPEN_RMQ_MNGMT_PORT=$(get_random_unused_port)
fi

OLD_RMQ_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-RabbitMQ-$VULTR_RABBITMQ_CONTAINER_PORT-$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT"
NEW_RMQ_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-RabbitMQ-$OPEN_RMQ_PORT-$OPEN_RMQ_MNGMT_PORT"
# if either port has changed delete the existing container and run a new one
if [[ "$OPEN_RMQ_PORT" != "$VULTR_RABBITMQ_CONTAINER_PORT" || "$OPEN_RMQ_MNGMT_PORT" != "$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT" ]]; then
  # delete the container using the old port if it exists
  if [ "$(docker ps -aq -f name="$OLD_RMQ_CONTAINER_NAME")" ]; then
    docker rm -f "$OLD_RMQ_CONTAINER_NAME"
  fi
  docker run "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'rabbitmq')" --name "$NEW_RMQ_CONTAINER_NAME" -d \
    -p $OPEN_RMQ_PORT:5672 -p $OPEN_RMQ_MNGMT_PORT:15672
  printf "Open port found: %s\n PLEASE COPY THIS PORT TO THE - VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT ENV VAR\n" \
    "--------------------------------\n" "$OPEN_RMQ_PORT"
else
  # if the ports are available and haven't changed then either the container exists or this is the first time the script has run
  if [ "$(docker ps -aq status=exited -f name="$OLD_RMQ_CONTAINER_NAME")" ]; then
    # docker container exists but is shutdown so start it back up
    docker start "$OLD_RMQ_CONTAINER_NAME"
  elif [ "$(docker ps -aq status=exited -f name="$OLD_RMQ_CONTAINER_NAME")" ]; then
    # docker container was created but never started
    docker start "$OLD_RMQ_CONTAINER_NAME"
  elif [ "$(docker ps -q -f name="$OLD_RMQ_CONTAINER_NAME")" ]; then
    # docker container exists and is already running
    printf "RabbitMQ Docker Container is already running! Please don't forget to shutdown your container when you are done!"
  else
    # the docker container was never created i.e. first time running this script
    docker run "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'rabbitmq')" --name "$OLD_RMQ_CONTAINER_NAME" -d \
      -p $OPEN_RMQ_PORT:5672 -p $OPEN_RMQ_MNGMT_PORT:15672
  fi
fi

# ------------------------ Redis -----------------------------------
OLD_REDIS_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-Redis-$VULTR_REDIS_CONTAINER_PORT"
REDIS_PORT_NOT_AVAILABLE=$(sudo --prompt="" -S -- "lsof -i:$VULTR_REDIS_CONTAINER_PORT" <<< "$VULTR_DOCKER_ADMIN_PASSWORD")
if [[ -z "$REDIS_PORT_NOT_AVAILABLE" ]]; then
  printf "--------------------------------\nThe given Redis port %s is available!\n" "$VULTR_REDIS_CONTAINER_PORT"
  OPEN_REDIS_PORT=$VULTR_REDIS_CONTAINER_PORT
  # if the ports are available and haven't changed then either the container exists or this is the first time the script has run
  if [ "$(docker ps -aq status=exited -f name="$OLD_REDIS_CONTAINER_NAME")" ]; then
    # docker container exists but is shutdown so start it back up
    docker start "$OLD_REDIS_CONTAINER_NAME"
  elif [ "$(docker ps -aq status=exited -f name="$OLD_REDIS_CONTAINER_NAME")" ]; then
    # docker container was created but never started
    docker start "$OLD_REDIS_CONTAINER_NAME"
  elif [ "$(docker ps -q -f name="$OLD_REDIS_CONTAINER_NAME")" ]; then
    # docker container exists and is already running
    printf "RabbitMQ Docker Container is already running! Please don't forget to shutdown your container when you are done!"
  else
    # the docker container was never created i.e. first time running this script
    docker run "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'redis')" --name "$OLD_REDIS_CONTAINER_NAME" -d \
      -p $OPEN_REDIS_PORT:6379
  fi
else
  printf "WARNING: The given Redis port %s is not available!\nSearching for an open port...\n" "$VULTR_REDIS_CONTAINER_PORT"
  OPEN_REDIS_PORT=$(get_random_unused_port)
  printf "Open port found: %s\n PLEASE COPY THIS PORT TO THE - VULTR_REDIS_CONTAINER_PORT ENV VAR\n" \
    "--------------------------------\n" "$OPEN_REDIS_PORT"
  # delete the container using the old port if it exists
  if [ "$(docker ps -aq -f name="$OLD_REDIS_CONTAINER_NAME")" ]; then
    docker rm -f "$OLD_REDIS_CONTAINER_NAME"
  fi
  NEW_REDIS_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-Redis-$OPEN_REDIS_PORT"
  docker run "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'redis')" --name "$NEW_REDIS_CONTAINER_NAME" -d \
    -p $OPEN_REDIS_PORT:6379
  printf "Open port found: %s\n PLEASE COPY THIS PORT TO THE - VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT ENV VAR\n" \
    "--------------------------------\n" "$OPEN_RMQ_PORT"
fi

EOF

