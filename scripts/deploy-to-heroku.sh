#!/bin/bash

## Note must be run from root directory due to relative paths (How github CI runs it)

set -e

if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <email> <api_key> <app_name> <commit_sha>"
    exit 1
fi

email=$1
api_key=$2
app_name=$3
commit_sha=$4

echo "Deploying Git commit sha: $commit_sha"

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

# Needed for commonwealth_base
docker build -f Dockerfile.datadog -t datadog-base .

deploy_heroku_app() {
  local app_path=$1
  local app_name=$2
  local git_commit_sha=$3

  process_types=""
  for dockerfile in ${app_path}/Dockerfile.*; do
     base_name=$(basename $dockerfile | cut -d. -f2)

     heroku_tag=registry.heroku.com/${app_name}/${base_name}

     docker build -f ${dockerfile} -t ${heroku_tag}:latest --build-arg RAILWAY_GIT_COMMIT_SHA=${git_commit_sha} .

     echo docker image ls

     docker push ${heroku_tag}:latest

     process_types="${process_types} ${base_name}"
  done

  process_types=$(echo $process_types | xargs)

  # We get "Lost connection with release dyno." sometimes. So if we do, retry 5 times
  for i in {1..10}; do
    output=$(heroku container:release ${process_types} -a ${app_name} 2>&1) && break

    echo "$output"

    # If it passes, break out of loop
    if simulate_heroku_release; then
      break
    fi

    sleep 2
  done
}

docker build . --target commonwealth -t commonwealth -f Dockerfile.commonwealth_base
deploy_heroku_app "./packages/commonwealth/deploy/dockerfiles" ${app_name} ${commit_sha}