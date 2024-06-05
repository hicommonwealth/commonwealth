#! /bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# build
if [ "$SL_BUILD" = true ]; then
  pnpm -F snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  pnpm -F discord-bot build
else
  pnpm -F commonwealth build
  pnpm -F scripts build # builds sitemap
fi
