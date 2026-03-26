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
  echo "No changed frontend TS/TSX files for boundary lint."
  exit 0
fi

echo "Boundary lint candidate files:"
printf '%s\n' "${CHANGED_TS_FILES[@]}"

if [ "${BOUNDARY_LINT_WARN_ONLY:-false}" = "true" ]; then
  (
    cd "$ROOT_DIR"
    NODE_OPTIONS='--max-old-space-size=16384' eslint --no-eslintrc --cache -c ./.eslintrc-boundaries.cjs "${CHANGED_TS_FILES[@]}"
  )
else
  (
    cd "$ROOT_DIR"
    NODE_OPTIONS='--max-old-space-size=16384' eslint --no-eslintrc --cache -c ./.eslintrc-boundaries.cjs "${CHANGED_TS_FILES[@]}" --max-warnings=0
  )
fi
