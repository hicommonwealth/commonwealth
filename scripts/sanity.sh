#! /bin/bash

# Sanity scripts we should run locally before pushing code
set -e 

# lint changes
yarn lint-branch-warnings

# check types 
# incrementally builds server/libs (tsc -b --noEmit is not allowed)
yarn workspaces run clean
echo "Building before type checking..."
yarn workspace commonwealth build
yarn workspace scripts build
echo "Type checking..."
yarn workspaces run check-types

# run unit tests
echo "Unit tests..."
yarn workspaces run test

# run api test
echo "Api test..."
yarn workspace commonwealth test-api

# we are aiming for a devx without builds
yarn workspaces run clean
