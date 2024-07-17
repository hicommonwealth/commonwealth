#!/bin/bash

userId=$1
app=${2:-local}

if [ -z "$userId" ]; then
  echo "Error: userId argument is required. Usage: pnpm delete-user [userId]"
  exit 1
fi

if [ "$app" == "local" ]; then
  pnpm ts-exec scripts/delete-user.ts "$userId"
elif [ "$app" == "frick" ] || [ "$app" == "frack" ] || [ "$app" == "beta" ]; then
  NODE_ENV=production DATABASE_URL=$(heroku config:get DATABASE_URL -a commonwealth-"$app") \
  JWT_SECRET=$(heroku config:get DATABASE_URL -a commonwealth-"$app") \
  pnpm ts-exec scripts/delete-user.ts "$userId"
else
  echo "Invalid app argument. Please use 'local', 'frick', 'frack', or 'beta'."
fi