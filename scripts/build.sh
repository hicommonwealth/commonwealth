if [ "$CE_BUILD" = true ]; then
  yarn --cwd packages/chain-events build-services
elif [ "$SL_BUILD" = true ]; then
  yarn --cwd packages/snapshot-listener build  
elif [ "$CW_BUILD" = true ]; then
  yarn --cwd packages/commonwealth build
elif [ "$SL_BUILD" = true ]; then
  yarn --cwd packages/snapshot-listener build
else
