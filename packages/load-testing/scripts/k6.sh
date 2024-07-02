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

# Determine the OS
OS=$(uname -s)

K6_BINARY="./k6"

build_k6_binary() {
    # Execute the appropriate command based on the OS
    if [ "$OS" == "Linux" ]; then
        # -u should normally be set to "$(id -u):$(id -g)" but this produces a permission error in some systems
        run_docker_command run --rm -u root -v "${PWD}:/xk6" grafana/xk6 build --with github.com/grafana/xk6-sql --with github.com/grafana/xk6-ts
    elif [ "$OS" == "Darwin" ]; then
        # -u should normally be set to "$(id -u):$(id -g)" but this produces a permission error in some systems
        run_docker_command run --rm -e GOOS=darwin -u root -v "${PWD}:/xk6" grafana/xk6 build --with github.com/grafana/xk6-sql --with github.com/grafana/xk6-ts
    else
        echo "Unsupported OS: $OS"
        exit 1
    fi
}

if [ ! -f "$K6_BINARY" ]; then
    # Build k6 binary with Docker if it does not exist
    build_k6_binary
fi

# If k6 binary exists, require a filepath to a .ts file
if [ -z "$1" ]; then
    echo "Usage: pnpm test test/<path_to_file>.spec.ts"
    exit 1
fi

$K6_BINARY run "$1"