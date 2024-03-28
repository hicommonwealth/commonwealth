#!/bin/bash

# Function to check if docker can be run without sudo
can_run_docker_without_sudo() {
    docker info > /dev/null 2>&1
    return $?
}

# Function to run Docker with or without sudo
run_docker_command() {
    if can_run_docker_without_sudo; then
        docker "$@"
    else
        sudo docker "$@"
    fi
}

# Check the command line argument and run the appropriate Docker command
case "$1" in
    rmq)
        # RabbitMQ command
        run_docker_command run -it -d --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.11-management
        ;;
    redis)
        # Redis command
        run_docker_command run -it -d --rm --name redis -p 6379:6379 redis:latest
        ;;
    *)
        echo "Usage: $0 {rmq|redis}"
        exit 1
        ;;
esac
