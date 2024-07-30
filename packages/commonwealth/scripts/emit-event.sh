#!/bin/bash

notif_type=$1
app=${2:-local}

if [ -z "$notif_type" ]; then
  echo "Error: notification type argument is required. Usage: pnpm delete-user [chain-event | snapshot]"
  exit 1
fi

if [ "$notif_type" != "snapshot" ] && [ "$notif_type" != "chain-event" ]; then
  echo "Error: notification type must be one of 'snapshot', 'chain-event'"
  exit 1
fi

if [ "$app" == "local" ]; then
  pnpm ts-exec scripts/emit-event.ts "$notif_type"
elif [ "$app" == "frick" ] || [ "$app" == "frack" ] || [ "$app" == "beta" ]; then
  NODE_ENV=production DATABASE_URL=$(heroku config:get DATABASE_URL -a commonwealth-"$app") \
  JWT_SECRET=$(heroku config:get DATABASE_URL -a commonwealth-"$app") \
  pnpm ts-exec scripts/emit-event.ts "$notif_type"
else
  echo "Invalid app argument. Please use 'local', 'frick', 'frack', or 'beta'."
fi