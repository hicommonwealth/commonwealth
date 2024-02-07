#! /bin/bash

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
# this should be: yarn workspaces run test
# this should be added to CI: yarn workspace @hicommonwealth/adapters test
NODE_ENV=test yarn workspace @hicommonwealth/model test
NODE_ENV=test yarn workspace commonwealth unit-test