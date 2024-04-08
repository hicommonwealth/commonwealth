#! /bin/bash

# Sanity scripts we should run locally before pushing code
set -e

# lint changes
pnpm run lint-branch-warnings

# check types
# incrementally builds server/libs (tsc -b --noEmit is not allowed)
pnpm m run clean
(cd packages/commonwealth && pnpm run build)
pnpm m run check-types

# run unit tests
yarn m run test

# run api test
(cd packages/commonwealth && pnpm run test-api)

# we are aiming for a devx without builds
pnpm m run clean
