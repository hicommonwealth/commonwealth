#!/usr/bin/env bash

# Sanity scripts we should run locally before pushing code
set -e

function step() {
  echo -e "\n \033[1;33m > $1 ... \033[0m \n"
}

step 'Linting'
yarn lint-branch-warnings

step 'Initial cleaning'
yarn workspaces run clean

step 'Building'
yarn workspace commonwealth build
yarn workspace scripts build

step 'Type checking'
yarn workspaces run check-types

step 'Unit testing'
yarn workspaces run test

step 'Integration testing'
yarn workspace commonwealth test-api
yarn workspace commonwealth test-integration-util

# we are aiming for a devx without builds
step 'Final cleaning'
yarn workspaces run clean
