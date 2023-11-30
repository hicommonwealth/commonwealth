if [ "$CW_BUILD" = true ]; then
  yarn --cwd packages/commonwealth build-all
elif [ "$SL_BUILD" = true ]; then
  yarn --cwd packages/snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  yarn --cwd packages/discord-bot build
else
  yarn --cwd packages/commonwealth build
fi
