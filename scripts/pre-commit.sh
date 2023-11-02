#!/bin/bash

GRAY='\033[30m'  
RED='\033[31m' 
YELLOW='\033[33m'
NC='\033[0m' 

FILES=$(git diff --name-only master)

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