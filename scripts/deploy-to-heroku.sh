#!/bin/bash

if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <email> <api_key> <app_name> <heroku_app_name>"
    exit 1
fi

email=$1
api_key=$2
app_name=$3
heroku_app_name=$4

cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${api_key}
machine git.heroku.com
    login ${email}
    password ${api_key}
EOF

heroku git:remote --app ${app_name}

heroku container:push --recursive -a ${heroku_app_name}

heroku container:release web consumer evm_ce knock message_relayer-a ${heroku_app_name}
