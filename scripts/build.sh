if [ "$CE_BUILD" = true ]; then
  yarn --cwd packages/chain-events build-services
elif [ "$CW_BUILD" = true ]; then
  yarn --cwd packages/commonwealth build-all
elif [ "$SL_BUILD" = true ]; then
  yarn --cwd packages/snapshot-listener build
else
  yarn --cwd packages/chain-events build-services && yarn --cwd packages/commonwealth build
fi
