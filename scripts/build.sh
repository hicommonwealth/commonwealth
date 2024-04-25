#! /bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# build
if [ "$SL_BUILD" = true ]; then
  pnpm --filter ./packages/snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  pnpm --filter ./packages/discord-bot build
else
  NODE_OPTIONS=--max_old_space_size=4096 pnpm --filter ./packages/commonwealth bundle
  pnpm --filter ./packages/commonwealth build
fi
