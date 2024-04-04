#!/usr/bin/env bash

# Sanity scripts we should run locally before pushing code
set -e

# lint changes
yarn lint-branch-warnings

# check types
# incrementally builds server/libs (tsc -b --noEmit is not allowed)
yarn workspaces run clean
yarn workspace commonwealth build
yarn workspaces run check-types

# run unit tests
yarn workspaces run test

# run api test
yarn workspace commonwealth test-api

# we are aiming for a devx without builds
yarn workspaces run clean
