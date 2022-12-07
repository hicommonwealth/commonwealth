if [ "$CE_BUILD" = true ]; then
  yarn --cwd packages/chain-events build-services
elif [ "$SL_BUILD" = true ]; then
  yarn --cwd packages/snapshpt-listner build && yarn --cwd start 
elif [ "$CW_BUILD" = true ]; then
  yarn --cwd packages/commonwealth build
else
  yarn --cwd packages/chain-events build-services && yarn --cwd packages/commonwealth build 
fi;
