#!/bin/bash

GRAY='\033[30m'  
RED='\033[31m' 
YELLOW='\033[33m'
NC='\033[0m' 

FILES=$(git diff --staged --name-only --diff-filter=d)

if [ -n "$FILES" ]
then
    echo -e -n $YELLOW
    echo "------------------------------------------------------"
    echo -e "Formatting files before commit..."
    echo "------------------------------------------------------"
    echo -e -n $GRAY
    echo "$FILES" | tr ' ' '\n' | xargs -I {} echo "- {}"
    echo -e $NC
    echo "$FILES" | tr ' ' '\n' | xargs -I {} npx prettier --write --ignore-unknown {}
    git add .
fi
