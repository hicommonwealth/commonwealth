#! /bin/bash

# build
if [ "$SL_BUILD" = true ]; then
  yarn workspace snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  yarn workspace discord-bot build
else
  NODE_OPTIONS=--max_old_space_size=4096 yarn workspace commonwealth bundle
  exit 2
fi
