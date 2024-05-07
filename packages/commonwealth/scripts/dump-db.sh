#!/bin/bash

dumpType=${1:-partial}
dumpName=${2:-latest.dump}

if [ "$dumpType" = "full" ]; then
    pg_dump "$(heroku config:get HEROKU_POSTGRESQL_MAROON_URL -a commonwealth-beta)" --verbose --no-privileges --no-owner -f $dumpName
elif [ "$dumpType" = "partial" ]; then
    pg_dump "$(heroku config:get HEROKU_POSTGRESQL_MAROON_URL -a commonwealth-beta)" --verbose --exclude-table-data="public.\"Subscriptions\"" --exclude-table-data="public.\"Sessions\"" --exclude-table-data="public.\"LoginTokens\"" --exclude-table-data="public.\"Notifications\"" --exclude-table-data="public.\"Webhooks\"" --exclude-table-data="public.\"NotificationsRead\"" --no-privileges --no-owner -f $dumpName
else
    dumpName=$dumpType
    pg_dump "$(heroku config:get HEROKU_POSTGRESQL_MAROON_URL -a commonwealth-beta)" --verbose --exclude-table-data="public.\"Subscriptions\"" --exclude-table-data="public.\"Sessions\"" --exclude-table-data="public.\"LoginTokens\"" --exclude-table-data="public.\"Notifications\"" --exclude-table-data="public.\"Webhooks\"" --exclude-table-data="public.\"NotificationsRead\"" --no-privileges --no-owner -f $dumpName
fi