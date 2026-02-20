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
  echo "No changed frontend TS/TSX files for legacy import guard."
  exit 0
fi

LEGACY_ALIAS_REGEX="(from|import\\(|require\\()[[:space:]]*['\"](views|helpers|hooks|controllers|models|stores|utils)(/|['\"])"
LEGACY_RELATIVE_REGEX="(from|import\\(|require\\()[[:space:]]*['\"][^'\"]*/(views|helpers|hooks|controllers|models|stores|utils)(/|['\"])"

violations=0

for file_path in "${CHANGED_TS_FILES[@]}"; do
  while IFS= read -r added_line; do
    if [[ "$added_line" =~ ^\+\+\+ ]]; then
      continue
    fi

    if ( [[ "$added_line" =~ $LEGACY_ALIAS_REGEX ]] || [[ "$added_line" =~ $LEGACY_RELATIVE_REGEX ]] ) \
       && ! [[ "$added_line" =~ \'client/scripts/ ]] && ! [[ "$added_line" =~ \"client/scripts/ ]]; then
      clean_line="${added_line#+}"
      echo "Legacy import guard violation: ${file_path}"
      echo "  + ${clean_line}"
      violations=$((violations + 1))
    fi
  done < <(
    git -C "$ROOT_DIR" diff "origin/$BASE_BRANCH...HEAD" -U0 -- "$file_path" \
      | grep -E '^\+[^+]' || true
  )
done

if [ "$violations" -gt 0 ]; then
  echo "Found $violations newly introduced legacy import(s)."
  exit 1
fi

echo "No newly introduced legacy imports found."
