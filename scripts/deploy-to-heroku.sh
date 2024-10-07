#!/bin/bash

## Note must be run from root directory due to relative paths (How github CI runs it)

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

env_path=./packages/commonwealth/deploy/environments/.env.public.${app_name}
if [ ! -f ${env_path} ]; then
  echo "Error: ${env_path} not found"
  exit 1
fi

cp ${env_path} .env

# Needed for commonwealth_base
docker build -f Dockerfile.datadog -t datadog-base .

deploy_heroku_app() {
  local app_path=$1
  local app_name=$2

  process_types=""
  for dockerfile in ${app_path}/Dockerfile.*; do
     base_name=$(basename $dockerfile | cut -d. -f2)

     heroku_tag=registry.heroku.com/${app_name}/${base_name}

     docker build -f ${dockerfile} -t ${heroku_tag}:latest .

     echo docker image ls

     docker push ${heroku_tag}:latest

     process_types="${process_types} ${base_name}"
  done

  process_types=$(echo $process_types | xargs)
  heroku container:release ${process_types} -a ${app_name}
}

docker build . --target commonwealth -t commonwealth -f Dockerfile.commonwealth_base
deploy_heroku_app "./packages/commonwealth/deploy/dockerfiles" ${app_name}

snapshot_listener_app_name=snapshot-listener-staging
discord_bot_app_name=discobot-listener-staging
if [ "${app_name}" == "commonwealthapp" ]; then
  snapshot_listener_app_name="snapshot-listener"
  discord_bot_app_name="discobot-listener"
fi

docker build . --target snapshot-listener -t snapshot-listener -f Dockerfile.commonwealth_base
deploy_heroku_app "./packages/snapshot-listener/deploy/dockerfiles" ${snapshot_listener_app_name}

docker build . --target discord-bot -t discord-bot -f Dockerfile.commonwealth_base
deploy_heroku_app "./packages/discord-bot/deploy/dockerfiles" ${discord_bot_app_name}