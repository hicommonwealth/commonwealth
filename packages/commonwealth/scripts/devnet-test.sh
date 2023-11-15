#!/bin/bash

# Default TEST_DIR to 'cosmos' if not set
TEST_DIR=${TEST_DIR:-cosmos}

# Log all the arguments passed to the script
echo "Arguments passed to the script: $@"

nyc ts-mocha --project tsconfig.json "./test/devnet/${TEST_DIR:-.}/**/*.spec.ts" "$@"