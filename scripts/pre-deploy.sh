#!/bin/bash

set -e

# Check if release trigger is enabled (first argument)
TRIGGER_RELEASE=${1:-true}

# Trigger release for current commit (optional)
if [ "$TRIGGER_RELEASE" = "true" ]; then
  echo "Triggering release for commit: $RAILWAY_GIT_COMMIT_SHA"
  curl -X POST "${RAILWAY_RELEASER_API}/queue" \
    -H "Content-Type: application/json" \
    -d "{\"commitSha\": \"$RAILWAY_GIT_COMMIT_SHA\"}"
else
  echo "Skipping release trigger, waiting for existing release..."
fi

# Wait for release to complete
while true; do
  STATUS=$(curl -s "${RAILWAY_RELEASER_API}/release?commit-sha=$RAILWAY_GIT_COMMIT_SHA" | jq -r '.state')

  if [ "$STATUS" = "success" ]; then
    echo "Release completed successfully!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Release failed!"
    exit 1
  fi

  echo "Release status: $STATUS, waiting..."
  sleep 10
done