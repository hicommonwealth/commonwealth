#!/bin/bash

user=$1
app=${2:-local}

if [ -z "$user" ]; then
  echo "Error: user argument is required. Usage: pnpm delete-user [user id | user email]"
  exit 1
fi

if [ "$app" == "local" ]; then
  pnpm ts-exec scripts/delete-user.ts "$user"
elif [ "$app" == "frick" ] || [ "$app" == "frack" ] || [ "$app" == "beta" ]; then
  NODE_ENV=production DATABASE_URL=$(heroku config:get DATABASE_URL -a commonwealth-"$app") \
  JWT_SECRET=$(heroku config:get DATABASE_URL -a commonwealth-"$app") \
  pnpm ts-exec scripts/delete-user.ts "$user"
else
  echo "Invalid app argument. Please use 'local', 'frick', 'frack', or 'beta'."
fi