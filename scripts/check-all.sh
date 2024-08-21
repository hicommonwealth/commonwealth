#!/bin/bash

echo "Running check-all"

pnpm lint-branch &
lint_status=$?

pnpm -r run lint-diff &
lint_diff_status=$?

pnpm --silent -r build

pnpm -r check-types
check_types_status=$?

if [ $lint_status -ne 0 ] || [ $lint_diff_status -ne 0 ] || [ $check_types_status -ne 0 ]; then
  echo "Linting failed."
  exit 1
fi