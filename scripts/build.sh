if [ "$CE_BUILD" = true ]; then
  yarn --cwd packages/chain-events build-services
elif [ "$CW_BUILD" = true ]; then
  yarn --cwd packages/commonwealth build
else
  yarn --cwd packages/chain-events build-services && yarn --cwd packages/commonwealth build
fi;
