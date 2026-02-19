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
  echo "No changed frontend TS/TSX files for stub import guard."
  exit 0
fi

STUB_REGEX="(helpers/(constants|formatting|dates|link)|hooks/(useDraft|useBeforeUnload|useWindowResize|useNecessaryEffect|useForceRerender))"
IMPORT_PREFIX_REGEX="(from|import\\(|require\\()[[:space:]]*['\"][^'\"]*"
IMPORT_SUFFIX_REGEX="([./'\"]|$)"

violations=0

for file_path in "${CHANGED_TS_FILES[@]}"; do
  while IFS= read -r added_line; do
    if [[ "$added_line" =~ ^\+\+\+ ]]; then
      continue
    fi

    if echo "$added_line" | grep -Eq "${IMPORT_PREFIX_REGEX}${STUB_REGEX}${IMPORT_SUFFIX_REGEX}"; then
      clean_line="${added_line#+}"
      echo "Stub import guard violation: ${file_path}"
      echo "  + ${clean_line}"
      violations=$((violations + 1))
    fi
  done < <(
    git -C "$ROOT_DIR" diff "origin/$BASE_BRANCH...HEAD" -U0 -- "$file_path" \
      | grep -E '^\+[^+]' || true
  )
done

if [ "$violations" -gt 0 ]; then
  echo "Found $violations newly introduced deprecated stub import(s)."
  exit 1
fi

echo "No newly introduced stub imports found."
