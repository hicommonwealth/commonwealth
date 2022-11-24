if [ "$CE_ENV" ]; then
  yarn --cwd packages/chain-events build-services
elif [ "$CW_ENV" ]; then
  yarn --cwd packages/commonwealth heroku-postbuild
else
  yarn --cwd packages/chain-events build-services && yarn --cwd packages/commonwealth heroku-postbuild
fi;
