#!/bin/bash

set -e

# Check required environment variables
REQUIRED_VARS=("RAILWAY_GIT_COMMIT_SHA" "RAILWAY_RELEASER_API")
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "Error: $VAR environment variable is not set."
    exit 1
  fi
done

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

# Wait for release to complete with a 30-minute timeout
START_TIME=$(date +%s)
TIMEOUT=$((30 * 60)) # 30 minutes in seconds

while true; do
  STATUS=$(curl -s "${RAILWAY_RELEASER_API}/release?commit-sha=$RAILWAY_GIT_COMMIT_SHA" | jq -r '.state')

  if [ "$STATUS" = "success" ]; then
    echo "Release completed successfully!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Release failed!"
    exit 1
  fi

  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "Timed out waiting for release after 30 minutes."
    exit 1
  fi

  echo "Release status: $STATUS, waiting..."
  sleep 10
done