#!/bin/bash

set -e

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

heroku container:login

heroku git:remote --app ${app_name}

docker build -f Dockerfile.commonwealth_base -t commonwealth_base .

heroku container:push --recursive -a ${heroku_app_name}

heroku container:release web evm_ce consumer message_relayer knock -a ${heroku_app_name}
