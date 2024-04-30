#!/usr/bin/env bash

# Sanity scripts we should run locally before pushing code
set -e

# lint changes
echo -e "\n \033[1;33m > Linting ... \033[0m \n"
yarn lint-branch-warnings

echo -e "\n \033[1;33m > Initial cleaning... \033[0m \n"
yarn workspaces run clean

# check types
# incrementally builds server/libs (tsc -b --noEmit is not allowed)
echo -e "\n \033[1;33m > Building ... \033[0m \n"
yarn workspace commonwealth build
yarn workspace scripts build

echo -e "\n \033[1;33m > Type checking ... \033[0m \n"
yarn workspaces run check-types

# run unit tests
echo -e "\n \033[1;33m > Unit testing ... \033[0m \n"
yarn workspaces run test

# run api test
echo -e "\n \033[1;33m > Integration testing ... \033[0m \n"
yarn workspace commonwealth test-api
yarn workspace commonwealth test-integration-util

# we are aiming for a devx without builds
echo -e "\n \033[1;33m > Final cleaning ... \033[0m \n"
yarn workspaces run clean
