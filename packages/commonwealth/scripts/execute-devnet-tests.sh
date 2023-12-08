#!/bin/bash

# Check if an argument is provided
if [ "$#" -eq 1 ]; then
    # Check if the argument is 'cosmos'
    if [ "$1" == "cosmos" ]; then
        ts-mocha './test/devnet/cosmos/**/*.spec.ts'
    # Check if the argument is 'evm'
    elif [ "$1" == "evm" ]; then
        ts-mocha './test/devnet/evm/**/*.spec.ts'
    else
        echo "Invalid argument. Please use 'cosmos' or 'evm'."
        exit 1
    fi
else
    # Execute the default command if no argument is provided
    ts-mocha './test/devnet/**/*.spec.ts'
fi