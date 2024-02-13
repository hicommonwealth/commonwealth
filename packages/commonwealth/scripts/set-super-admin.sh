#!/bin/bash

# Check if an argument was provided and if it is one of the specified values
if [ $# -eq 1 ] && [[ ! $1 =~ ^(frick|frack|demo|beta)$ ]]; then
    echo "Error: If provided, argument must be one of 'frick', 'frack', 'demo', or 'beta'."
    exit 1
fi

if [[ $1 =~ ^(frick|frack|demo|beta)$ ]]; then
    DATABASE_URL=$(heroku config:get DATABASE_URL -a commonwealth-$1)
    echo "DATABASE_URL is set to: $DATABASE_URL"
    DATABASE_URL=$DATABASE_URL NODE_ENV=production ts-node -r tsconfig-paths/register -T ./scripts/set-super-admin.ts
else
    ts-node -r tsconfig-paths/register -T ./scripts/set-super-admin.ts
fi