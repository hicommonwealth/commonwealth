#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
CONFIG_PATH="$ROOT_DIR/.eslintrc-boundaries-fixtures.cjs"
FIXTURE_ROOT="$ROOT_DIR/packages/commonwealth/test/boundaries/fixtures"
ALLOW_FIXTURE="$FIXTURE_ROOT/legacy-core/allowedImport.ts"
DENY_FIXTURE="$FIXTURE_ROOT/legacy-core/disallowedImport.ts"

echo "Running boundary fixture tests..."

echo "[1/2] Expect allow fixture to pass"
NODE_OPTIONS='--max-old-space-size=4096' eslint --no-eslintrc -c "$CONFIG_PATH" "$ALLOW_FIXTURE"

echo "[2/2] Expect deny fixture to fail with boundaries/element-types"
set +e
DENY_OUTPUT=$(NODE_OPTIONS='--max-old-space-size=4096' eslint --no-eslintrc -c "$CONFIG_PATH" "$DENY_FIXTURE" 2>&1)
DENY_EXIT=$?
set -e

if [ "$DENY_EXIT" -eq 0 ]; then
  echo "Boundary fixture test failed: deny fixture unexpectedly passed"
  echo "$DENY_OUTPUT"
  exit 1
fi

if ! echo "$DENY_OUTPUT" | grep -q "boundaries/element-types"; then
  echo "Boundary fixture test failed: expected boundaries/element-types violation"
  echo "$DENY_OUTPUT"
  exit 1
fi

echo "Boundary fixture tests passed."
