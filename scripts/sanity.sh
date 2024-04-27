#!/usr/bin/env bash

# Sanity scripts we should run locally before pushing code
set -e

# lint changes
echo "Linting..."
yarn lint-branch-warnings

echo "Initial cleaning..."
yarn workspaces run clean

# check types
# incrementally builds server/libs (tsc -b --noEmit is not allowed)
echo "Building..."
yarn workspace commonwealth build
yarn workspace scripts build

echo "Type checking..."
yarn workspaces run check-types

# run unit tests
echo "Unit testing..."
yarn workspaces run test

# run api test
echo "Integration testing..."
yarn workspace commonwealth test-api
yarn workspace commonwealth test-integration-util

# we are aiming for a devx without builds
echo "Final cleaning..."
yarn workspaces run clean
