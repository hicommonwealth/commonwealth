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

run_docker_command run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli generate \
    -i http://host.docker.internal:8080/api/v1/openapi.json \
    -g k6 \
    -o /local/packages/load-testing/generated-load-tests/ \
    --skip-validate-spec

