if [ "$1" = "all" ]; then
  concurrently -p '{name}' -c red,yellow,green,blue,magenta -n cw-app,cw-consumer,ce-app,ce-consumer,ce-subscriber 'yarn --cwd packages/commonwealth start' 'yarn --cwd packages/commonwealth start-consumer' 'yarn --cwd packages/chain-events start-app' 'yarn --cwd packages/chain-events start-consumer' 'yarn --cwd packages/chain-events start-subscriber'
elif [ "$1" = "apps" ]; then
  concurrently -p '{name}' -c red,green -n cw-app,ce-app 'yarn --cwd packages/commonwealth start' 'yarn --cwd packages/chain-events start-app'
else
  yarn start
fi;
