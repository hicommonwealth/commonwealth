#!/bin/bash

# TODO: check why prettier-new-work.sh processing all files

GRAY='\033[30m'  
RED='\033[31m' 
YELLOW='\033[33m'
NC='\033[0m' 

FILES=$(git diff origin/master...HEAD --name-only --diff-filter=d | grep -E '\.ts$|\.tsx$|\.scss$')

if [ -n "$FILES" ]
then
    echo -e -n $YELLOW
    echo "------------------------------------------------------"
    echo -e "Formatting files before committing..."
    echo "------------------------------------------------------"
    echo -e -n $GRAY
    echo "$FILES" | tr ' ' '\n' | xargs -I {} echo "- {}"
    echo -e $NC
    echo "$FILES" | tr ' ' '\n' | xargs -I {} npx prettier {} --write 
fi
