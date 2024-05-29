#!/usr/bin/env bash

# Sanity scripts we should run locally before pushing code
set -e

function step() {
  echo -e "\n \033[1;33m > $1 ... \033[0m \n"
}

step 'Linting'
pnpm lint-branch-warnings

step 'Initial cleaning'
pnpm -r clean

step 'Building'
pnpm -F commonwealth build
pnpm -F sitemaps build

step 'Type checking'
pnpm -r check-types

step 'Unit testing'
pnpm -r test

step 'Integration testing'
pnpm -F commonwealth test-api
pnpm -F commonwealth test-integration-util

# we are aiming for a devx without builds
step 'Final cleaning'
pnpm -r clean
