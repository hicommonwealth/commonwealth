#! /bin/bash

# Sanity checks before pushing code
yarn lint-branch-warnings && yarn workspaces run check-types && yarn workspace commonwealth unit-test
