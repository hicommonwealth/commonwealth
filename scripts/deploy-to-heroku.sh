#!/bin/bash

## Note must be run from root directory due to relative paths (How github CI runs it)

set -e

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <email> <api_key> <app_name>"
    exit 1
fi

start_step() {
  STEP_START=$(date +%s)
}

end_step() {
  STEP_END=$(date +%s)
  echo "[$1] took $((STEP_END - STEP_START)) seconds"
}

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


echo "===> heroku container:login"
start_step

heroku container:login

end_step "heroku container:login"

echo "===> heroku git:remote --app ${app_name}"
start_step

heroku git:remote --app ${app_name}

end_step "heroku git:remote"

env_path=./packages/commonwealth/deploy/environments/.env.public.${app_name}
if [ ! -f ${env_path} ]; then
  echo "Error: ${env_path} not found"
  exit 1
fi

cp ${env_path} .env


echo "===> docker build -f Dockerfile.datadog"
start_step

# Needed for commonwealth_base
docker build -f Dockerfile.datadog -t datadog-base .

end_step "docker build datadog-base"

deploy_heroku_app() {
  local app_path=$1
  local app_name=$2

  process_types=""
  for dockerfile in ${app_path}/Dockerfile.*; do
     base_name=$(basename $dockerfile | cut -d. -f2)

     heroku_tag=registry.heroku.com/${app_name}/${base_name}

     echo "===> docker build ${dockerfile}"
     start_step

     docker build -f ${dockerfile} -t ${heroku_tag}:latest .

     end_step "docker build ${base_name}"


     echo "===> docker push ${heroku_tag}"
     start_step
     echo docker image ls

     docker push ${heroku_tag}:latest

     end_step "docker push ${base_name}"

     process_types="${process_types} ${base_name}"
  done

  echo "===> heroku container:release ${process_types} -a ${app_name}"
  start_step
  process_types=$(echo $process_types | xargs)
  heroku container:release ${process_types} -a ${app_name}
  end_step "heroku release"
}

echo "===> docker build commonwealth"
start_step
docker build . --target commonwealth -t commonwealth -f Dockerfile.commonwealth_base
end_step "docker build commonwealth"

deploy_heroku_app "./packages/commonwealth/deploy/dockerfiles" ${app_name}