#!/bin/bash

# Script Usage Description
usage="Usage: $0 [commonwealth-beta|commonwealth-frick]"
target_app="discobot-listener-staging"

# Function to retrieve and update environment variables
update_env_vars() {
    app_name=$1

    # List of environment variables to update
    env_vars=("CLOUDAMQP_APIKEY" "CLOUDAMQP_URL" "DATABASE_URL")

    for var in "${env_vars[@]}"; do
        # Retrieve the value from the source app
        value=$(heroku config:get "$var" -a "$app_name")

        if [ -z "$value" ]; then
            echo "Error retrieving $var from $app_name"
            exit 1
        fi

        # Update the value in the target app
        heroku config:set "$var=$value" -a "$target_app"
    done

    SERVER_URL=$(heroku info -s -a "$app_name" | grep web_url | cut -d= -f2 | sed 's:/*$::')
    heroku config:set SERVER_URL="$SERVER_URL" -a "$target_app"

    echo "Environment variables updated successfully."
}

# Check the first command line argument
if [ "$1" == "commonwealth-beta" ] || [ "$1" == "commonwealth-frick" ]; then
    echo "Linking discobot-staging to $1"
    echo "Putting $target_app in maintenance mode"
    heroku maintenance:on -a "$target_app"

    # Call the function to update environment variables
    update_env_vars "$1"
    heroku maintenance:off -a "$target_app"
else
    echo "Invalid argument."
    echo "$usage"
    # Exit the script with a non-zero exit status to indicate incorrect usage
    exit 1
fi