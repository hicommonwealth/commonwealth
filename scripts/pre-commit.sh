#!/bin/bash

GRAY='\033[30m'  
RED='\033[31m' 
YELLOW='\033[33m'
NC='\033[0m' 

# Prettier best practice for pre-commit hooks
# Using option 5 until we decide to integrate eslint (and switch to option 1)
# https://prettier.io/docs/en/precommit.html#option-5-shell-script
FILES=$(git diff --staged --name-only --diff-filter=d)

# Getting diff from master as suggested by Timothy 
# while we establish our formatting rules
# FILES=$(git diff --name-only --diff-filter=d master)

if [ -n "$FILES" ]
then
    echo -e -n $YELLOW
    echo -e "📐 prettier staged before commit..."
    echo "------------------------------------"
    echo -e $NC
    echo "$FILES" | xargs npx prettier --write --ignore-unknown
    echo "$FILES" | xargs git add
    exit 0
fi