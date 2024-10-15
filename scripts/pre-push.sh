#!/bin/bash

RED='\033[31m'
YELLOW='\033[33m'
NC='\033[0m'

FILES=$(git diff origin/master...HEAD --name-only --diff-filter=d | grep -E '\.ts$|\.tsx$|\.scss$')

if [ -n "$FILES" ]
then
    echo -e -n $YELLOW
    echo -e "🧹 eslint check before push..."
    echo "-------------------------------"
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

set -e

# Update the openAPI spec and api-client package.json version if needed
pnpm -F commonwealth ts-exec server/scripts/validate-external-api-versioning.ts

# Run prettier on JSON files to maintain formatting after updating version
prettier --write ../libs/api-client/package.json ../packages/commonwealth/server/external-api-config.json

# Check for changes in package.json or external-api-config.json files and commit the changes if any
changed_files=$(git diff --name-only ../libs/api-client/package.json ../packages/commonwealth/server/external-api-config.json)
if [ -n "$changed_files" ]; then
    echo "Committing auto-updated files"
    git add ../libs/api-client/package.json ../packages/commonwealth/external-api-config.json
    git commit -m "automated (pre-push): update api-client package.json and external api config"
fi