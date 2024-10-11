#!/bin/bash

set -e

# check if version number is different from production
# if they are different then generate the new OpenAPI spec
CURRENT_VERSION=$(pnpm info @commonxyz/api-client version)
LOCAL_VERSION=$(grep -m1 '"version":' package.json | sed -E 's/[^0-9]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/')

if [ "$CURRENT_VERSION" != "$LOCAL_VERSION" ]; then
  pnpm install -g fern-api@latest
  pnpm generate-client
  # without --no-git-checks pnpm doesn't want to publish the uncommited/generated src/ files
  pnpm publish --no-git-checks
fi