#! /bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# build
if [ "$SL_BUILD" = true ]; then
  yarn workspace snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  yarn workspace discord-bot build
else
  yarn workspace @hicommonwealth/core build
  yarn workspace @hicommonwealth/model build
  yarn workspace @hicommonwealth/chains build
  yarn workspace @hicommonwealth/adapters build

  NODE_OPTIONS=--max_old_space_size=4096 yarn workspace commonwealth bundle
  yarn workspace commonwealth build
fi
