#!/bin/bash

export $(grep -v '^#' .env | xargs -d '\n' -e)

if [[ -z "$VULTR_IP" ]]; then
    echo "Must provide VULTR_IP in .env" 1>&2
    exit 1
    elif [[ -z "$VULTR_USER" ]]; then
      echo "Must provide VULTR_USER in .env" 1>&2
      exit 1
fi

printf "Attempting to connect to %s@%s\n" "$VULTR_USER" "$VULTR_IP"
ssh "$VULTR_USER"@"$VULTR_IP" UNIQUE_DOCKER_CONTAINER_ID="$UNIQUE_DOCKER_CONTAINER_ID" \
  VULTR_RABBITMQ_CONTAINER_PORT="$VULTR_RABBITMQ_CONTAINER_PORT" \
  VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT="$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT" \
  VULTR_REDIS_CONTAINER_PORT="$VULTR_REDIS_CONTAINER_PORT" /bin/bash << "EOF"
  echo "Connection successful!"

  RMQ_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-RabbitMQ-$VULTR_RABBITMQ_CONTAINER_PORT-$VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT"
  REDIS_CONTAINER_NAME="$UNIQUE_DOCKER_CONTAINER_ID-Redis-$VULTR_REDIS_CONTAINER_PORT"

  docker stop "$RMQ_CONTAINER_NAME" "$REDIS_CONTAINER_NAME"

  echo "All containers successfully stopped!"
EOF
