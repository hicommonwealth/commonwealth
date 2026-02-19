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
LEGACY_RELATIVE_REGEX="(from|import\\(|require\\()[[:space:]]*['\"](\\./|\\.\\./)+(views|helpers|hooks|controllers|models|stores|utils)(/|['\"])"

matches_legacy_import() {
  local import_line="$1"
  [[ "$import_line" =~ $LEGACY_ALIAS_REGEX ]] || [[ "$import_line" =~ $LEGACY_RELATIVE_REGEX ]]
}

legacy_import_key() {
  local import_line="$1"
  local import_specifier
  import_specifier=$(printf '%s\n' "$import_line" | sed -nE "s/.*(from|import\\(|require\\()[[:space:]]*['\"]([^'\"]+)['\"].*/\\2/p")

  if [ -z "$import_specifier" ]; then
    echo ""
    return
  fi

  while [[ "$import_specifier" == ./* ]] || [[ "$import_specifier" == ../* ]]; do
    if [[ "$import_specifier" == ./* ]]; then
      import_specifier="${import_specifier#./}"
    fi

    if [[ "$import_specifier" == ../* ]]; then
      import_specifier="${import_specifier#../}"
    fi
  done

  echo "$import_specifier"
}

violations=0
removed_lines_file="$(mktemp)"

cleanup() {
  rm -f "$removed_lines_file"
}
trap cleanup EXIT

for file_path in "${CHANGED_TS_FILES[@]}"; do
  while IFS= read -r removed_line; do
    if [[ "$removed_line" =~ ^--- ]]; then
      continue
    fi

    clean_line="${removed_line#-}"
    if matches_legacy_import "$clean_line"; then
      key="$(legacy_import_key "$clean_line")"
      if [ -n "$key" ]; then
        printf '%s\n' "$key" >> "$removed_lines_file"
      fi
    fi
  done < <(
    git -C "$ROOT_DIR" diff "origin/$BASE_BRANCH...HEAD" -U0 -- "$file_path" \
      | grep -E '^\-[^-]' || true
  )
done

for file_path in "${CHANGED_TS_FILES[@]}"; do
  while IFS= read -r added_line; do
    if [[ "$added_line" =~ ^\+\+\+ ]]; then
      continue
    fi

    clean_line="${added_line#+}"
    if matches_legacy_import "$clean_line"; then
      key="$(legacy_import_key "$clean_line")"
      if [ -n "$key" ] && grep -Fqx -- "$key" "$removed_lines_file"; then
        reduced_removed_lines_file="$(mktemp)"
        awk -v target="$key" '
          !consumed && $0 == target { consumed = 1; next }
          { print }
        ' "$removed_lines_file" > "$reduced_removed_lines_file"
        mv "$reduced_removed_lines_file" "$removed_lines_file"
        continue
      fi

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
