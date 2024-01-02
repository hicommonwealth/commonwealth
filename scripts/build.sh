#! /bin/bash
 
# install 
yarn

# build libs
yarn build-libs

# build heroku app 
if [ "$CW_BUILD" = true ]; then
  yarn --cwd packages/commonwealth build
  yarn --cwd packages/commonwealth build-all # this is webpack
elif [ "$SL_BUILD" = true ]; then
  yarn --cwd packages/snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  yarn --cwd packages/discord-bot build
else
  yarn --cwd packages/commonwealth build
fi
