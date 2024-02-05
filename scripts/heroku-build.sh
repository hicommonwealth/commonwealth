#! /bin/bash

# builds configured app
yarn build

# clean other heroku apps - should we only keep /build folders?
if [ "$CW_BUILD" = true ]; then
  rm -rf packages/discord-bot
  rm -rf packages/snapshot-listener
elif [ "$SL_BUILD" = true ]; then
  rm -rf packages/commonwealth
  rm -rf packages/discord-bot
elif [ "$DL_BUILD" = true ]; then
  rm -rf packages/commonwealth
  rm -rf packages/snapshot-listener
fi