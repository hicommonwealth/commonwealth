#! /bin/bash

# Sanity scripts we should run locally before pushing code
yarn lint-branch-warnings && yarn workspaces run check-types && yarn workspace commonwealth unit-test