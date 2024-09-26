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

docker build . --target commonwealth -f Dockerfile.commonwealth_base -t commonwealth_base

commonwealth_path=./packages/commonwealth/deploy/dockerfiles

for dockerfile in ${commonwealth_path}/Dockerfile.*; do
   base_name=$(basename $dockerfile | cut -d. -f2)
   docker build -f $dockerfile -t ${base_name}:registry.heroku.com/${app_name}/${base_name} .
   echo "Built image ${base_name}:registry.heroku.com/${app_name}/${base_name} using $dockerfile"
done

process_types=""
for dockerfile in ${commonwealth_path}/Dockerfile.*; do
   base_name=$(basename $dockerfile | cut -d. -f2)

   heroku_tag=registry.heroku.com/${app_name}/${base_name}

   docker build -f $dockerfile -t ${heroku_tag}:latest .

   docker push ${heroku_tag}

   process_types="${process_types} ${base_name}"

   echo "Built and pushed image ${heroku_tag} using $dockerfile"
}

process_types=$(echo $process_types | xargs)
heroku container:release ${process_types} -a ${app_name}
