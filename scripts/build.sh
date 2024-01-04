# build libs (use tsc -b once project references are enabled)
yarn workspace @hicommonwealth/core build

if [ "$CW_BUILD" = true ]; then
  yarn --cwd packages/commonwealth build-all
elif [ "$SL_BUILD" = true ]; then
  yarn --cwd packages/snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  yarn --cwd packages/discord-bot build
else
  yarn --cwd packages/commonwealth build
fi
