#!/bin/bash

GRAY='\033[30m'  
RED='\033[31m' 
YELLOW='\033[33m'
NC='\033[0m' 

FILES=$(git diff origin/master...HEAD --name-only --diff-filter=d | grep -E '\.ts$|\.tsx$|\.scss$')

if [ -n "$FILES" ]
then
    echo -e -n $YELLOW
    echo -e "🧹 eslint check before push..."
    echo "-------------------------------"
    echo -e -n $GRAY
    echo "$FILES" | tr ' ' '\n' | xargs -I {} echo "- {}"
    echo -e $NC

    lint=$(NODE_OPTIONS="--max-old-space-size=8192" npx eslint $FILES | grep -E 'problems')
    if [ -n "$lint" ]
    then
        echo -e "[eslint] ${RED}${lint}${NC}"
    else
        echo -e "[eslint] 🚀🚀🚀"
    fi
fi
