#!/usr/bin/env bash

set -euo pipefail

BASE_BRANCH="${GITHUB_BASE_REF:-master}"
ROOT_DIR="$(git rev-parse --show-toplevel)"

if [ -n "${GITHUB_BASE_REF:-}" ]; then
  if ! git -C "$ROOT_DIR" show-ref --quiet "refs/remotes/origin/$BASE_BRANCH"; then
    git -C "$ROOT_DIR" fetch origin "$BASE_BRANCH"
  fi
fi

CHANGED_TS_FILES=()
while IFS= read -r file_path; do
  CHANGED_TS_FILES+=("$file_path")
done < <(
  git -C "$ROOT_DIR" diff "origin/$BASE_BRANCH...HEAD" --name-only --diff-filter=d \
    | grep -E '^packages/commonwealth/client/scripts/.*\.tsx?$' || true
)

if [ "${#CHANGED_TS_FILES[@]}" -eq 0 ]; then
  echo "No changed frontend TS/TSX files for circular dependency guard."
  exit 0
fi

echo "Circular dependency guard candidate files:"
printf '%s\n' "${CHANGED_TS_FILES[@]}"

(
  cd "$ROOT_DIR"
  NODE_OPTIONS='--max-old-space-size=8192' depcruise --config ./.dependency-cruiser.circular.cjs "${CHANGED_TS_FILES[@]}"
)
