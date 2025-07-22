#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <target-path>"
  echo "Example: $0 secret/review-apps/1120"
  exit 1
fi

TARGET_PATH="$1"
SOURCE_PATH="secret/baseenv"

echo "🔄 Copying secrets from $SOURCE_PATH to $TARGET_PATH..."

vault kv get -format=json "$SOURCE_PATH" | \
  jq -r '.data.data | to_entries | map("\(.key)=\(.value)") | .[]' | \
  xargs vault kv put "$TARGET_PATH"

echo "✅ Secrets successfully copied to $TARGET_PATH"
