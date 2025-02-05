#! /bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# build
pnpm -F commonwealth build
pnpm -F scripts build # builds sitemap
if [ -z "$NO_WEBPACK" ]; then
  NODE_OPTIONS=--max_old_space_size=8192 pnpm -F commonwealth bundle
fi
