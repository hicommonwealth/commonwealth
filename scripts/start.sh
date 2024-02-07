if [ "$1" = "all" ]; then
  concurrently -p '{name}' -c red,yellow -n cw-app,cw-consumer 'yarn --cwd packages/commonwealth start' 'yarn --cwd packages/commonwealth start-consumer'
elif [ "$1" = "apps" ]; then
  concurrently -p '{name}' -c red,blue -n cw-app,snapshot-app 'yarn --cwd packages/commonwealth start' 'yarn --cwd packages/snapshot-listener start'
else
  yarn start
fi;
