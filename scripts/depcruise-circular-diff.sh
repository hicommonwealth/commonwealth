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

TMP_JSON="$(mktemp)"
TMP_ERR="$(mktemp)"
TMP_CHANGED="$(mktemp)"
trap 'rm -f "$TMP_JSON" "$TMP_ERR" "$TMP_CHANGED"' EXIT

printf '%s\n' "${CHANGED_TS_FILES[@]}" > "$TMP_CHANGED"

set +e
(
  cd "$ROOT_DIR"
  NODE_OPTIONS='--max-old-space-size=8192' depcruise \
    --config ./.dependency-cruiser.circular.cjs \
    -T json \
    "${CHANGED_TS_FILES[@]}" > "$TMP_JSON" 2> "$TMP_ERR"
)
DEPCRUISE_EXIT=$?
set -e

if [ ! -s "$TMP_JSON" ]; then
  echo "depcruise did not return a JSON report."
  cat "$TMP_ERR"
  exit "${DEPCRUISE_EXIT:-1}"
fi

if node - "$TMP_JSON" "$TMP_CHANGED" "$BASE_BRANCH" "$ROOT_DIR" <<'NODE'
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const [jsonPath, changedPath, baseBranch, rootDir] = process.argv.slice(2);
const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const changedFiles = new Set(
  fs
    .readFileSync(changedPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
);

const circularEdges = [];
const addedImportSpecifiersBySource = new Map();

const getAddedImportSpecifiers = (source) => {
  if (addedImportSpecifiersBySource.has(source)) {
    return addedImportSpecifiersBySource.get(source);
  }

  let diff = '';
  try {
    diff = execFileSync(
      'git',
      ['-C', rootDir, 'diff', `origin/${baseBranch}...HEAD`, '-U0', '--', source],
      { encoding: 'utf8' },
    );
  } catch {
    const emptySet = new Set();
    addedImportSpecifiersBySource.set(source, emptySet);
    return emptySet;
  }

  const addedSpecifiers = new Set();
  for (const line of diff.split('\n')) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    const match = line.match(/(?:from|import\(|require\()\s*['"]([^'"]+)['"]/);
    if (!match?.[1]) continue;
    addedSpecifiers.add(match[1]);
  }

  addedImportSpecifiersBySource.set(source, addedSpecifiers);
  return addedSpecifiers;
};

for (const mod of report.modules || []) {
  if (!changedFiles.has(mod.source)) continue;
  const addedSpecifiers = getAddedImportSpecifiers(mod.source);

  for (const dep of mod.dependencies || []) {
    if (!dep.circular) continue;
    if (!dep.module || !addedSpecifiers.has(dep.module)) continue;
    circularEdges.push({
      source: mod.source,
      target: dep.resolved || dep.module || '<unknown>',
    });
  }
}

if (circularEdges.length === 0) {
  process.exit(0);
}

console.error('New circular dependency edges detected from changed files:');
for (const edge of circularEdges) {
  console.error(`  ${edge.source} -> ${edge.target}`);
}
process.exit(1);
NODE
then
  if [ "$DEPCRUISE_EXIT" -ne 0 ]; then
    echo "No new circular dependency edges introduced by changed files."
    echo "Ignoring pre-existing cycles outside changed-file source edges."
  else
    echo "Circular dependency guard passed."
  fi
else
  exit 1
fi
