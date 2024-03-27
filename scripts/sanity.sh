#!/usr/bin/env bash

# Sanity scripts we should run locally before pushing code
set -e

# lint changes
yarn lint-branch-warnings

# check types
# build libs to update types (tsc -b --noEmit is not allowed)
yarn workspaces run clean
yarn workspace @hicommonwealth/adapters build
yarn workspace @hicommonwealth/chains build
yarn workspace @hicommonwealth/model build
yarn workspaces run check-types

# run unit tests
yarn workspaces run test
