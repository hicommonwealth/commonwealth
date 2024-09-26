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

if [ ! -f ./packages/commonwealth/deploy/environments/.env.public.${app_name} ]; then
  echo "Error: ./packages/commonwealth/deploy/environments/.env.public.${app_name} not found"
  exit 1
fi

cp ./environments/.env.public.${app_name} .env

docker build -f Dockerfile.commonwealth_base -t commonwealth_base .

commonwealth_path=./packages/commonwealth/deploy/dockerfiles

for dockerfile in ${commonwealth_path}/Dockerfile.*; do
   base_name=$(basename $dockerfile | cut -d. -f2)
   docker build -f $dockerfile -t ${base_name}:registry.heroku.com/${app_name}/${base_name} .
   echo "Built image ${base_name}:registry.heroku.com/${app_name}/${base_name} using $dockerfile"
}

commonwealth_path=./packages/commonwealth/deploy/dockerfile

process_types=""
for dockerfile in ${commonwealth_path}/Dockerfile.*; do
   process_types="${process_types} ${base_name}"

   base_name=$(basename $dockerfile | cut -d. -f2)
   docker build -f $dockerfile -t ${base_name}:registry.heroku.com/${app_name}/${base_name} .
   docker push registry.heroku.com/${app_name}${base_name}
   echo "Built image ${base_name}:registry.heroku.com/${app_name}/${base_name} using $dockerfile"
}

process_types=$(echo $process_types | xargs)
heroku container:release ${process_types} -a ${app_name}
