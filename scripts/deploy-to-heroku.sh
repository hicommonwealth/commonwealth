#!/bin/bash

set -e

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <email> <api_key> <app_name>"
    exit 1
fi

email=$1
api_key=$2
app_name=$3

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

if [ ! -f ../../deployment/environments/.env.public.${app_name} ]; then
  echo "Error: ../../deployment/environments/.env.public.${app_name} not found!"
  exit 1
fi

cp ../deployment/environments/.env.public.${app_name} .env

docker build -f Dockerfile.commonwealth_base -t commonwealth_base .

heroku container:push --recursive -a ${app_name}

heroku container:release web evm_ce consumer message_relayer knock release -a ${app_name}
