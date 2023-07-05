#!/bin/bash

# Create a new Heroku app in the EU region
heroku create $APP_NAME --region eu

# Replace these values with your own
SOURCE_APP_NAME="commonwealth-beta"
APP_NAME="commonwealth-beta-eu"

# Fetch all environment variables from source app
env_vars=$(heroku config --app $SOURCE_APP_NAME)

# Loop through the environment variables
while IFS= read -r line; do
  # Check if the variable is not DATABASE_URL and does not start with HEROKU_
  if [[ ! "$line" =~ ^DATABASE_URL= ]] && [[ ! "$line" =~ ^HEROKU_ ]]; then
    # Extract variable name and value
    var_name=$(echo "$line" | cut -d= -f1)
    var_value=$(echo "$line" | cut -d= -f2-)
    
    # Set the environment variable in the destination app
    heroku config:set $var_name="$var_value" --app $APP_NAME
  fi
done <<< "$env_vars"

# Replace these values with your own
CUSTOM_DOMAIN="eu.affinity.fun"
# REDIS_ADDON_NAME="existing-redis-addon-name"
# MQ_ADDON_NAME="existing-mq-addon-name"



# Attach existing add-ons (Redis and MQ)
# heroku addons:attach $REDIS_ADDON_NAME --as REDIS --app $APP_NAME
# heroku addons:attach $MQ_ADDON_NAME --as MQ --app $APP_NAME


# Add custom domain
heroku domains:add $CUSTOM_DOMAIN --app $APP_NAME

# Deploy the app
git push heroku master

# Open the app in the browser
heroku open --app $APP_NAME
