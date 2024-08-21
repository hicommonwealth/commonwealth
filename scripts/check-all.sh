#!/bin/bash

echo "Running check-all"

pnpm lint-branch &
lint_pid=$!

pnpm -r run lint-diff &
lint_diff_pid=$!

pnpm --silent -r build

wait $lint_pid
lint_status=$?

wait $lint_diff_pid
lint_diff_status=$?

pnpm -r check-types
check_types_status=$?

if [ $lint_status -ne 0 ] || [ $lint_diff_status -ne 0 ] || [ $check_types_status -ne 0 ]; then
  echo "Linting failed."
  exit 1
fi