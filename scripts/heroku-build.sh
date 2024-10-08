#! /bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# builds configured app
pnpm build

# clean other heroku apps - should we only keep /build folders?
if [ "$CW_BUILD" = true ]; then
  rm -rf packages/snapshot-listener
elif [ "$SL_BUILD" = true ]; then
  rm -rf packages/commonwealth
fi