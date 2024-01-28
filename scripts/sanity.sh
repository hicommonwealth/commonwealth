#! /bin/bash

# Sanity scripts we should run locally before pushing code

# lint changes
yarn lint-branch-warnings

# check types 
# build libs to update types (tsc -b --noEmit is not allowed)
yarn workspaces run clean
yarn workspace @hicommonwealth/adapters tsc -b --emitDeclarationOnly
yarn workspace @hicommonwealth/chains tsc -b --emitDeclarationOnly
yarn workspace @hicommonwealth/model tsc -b --emitDeclarationOnly
yarn workspaces run check-types

# unit test
yarn workspace commonwealth unit-test