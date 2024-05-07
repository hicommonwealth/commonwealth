if [ "$1" = "all" ]; then
  concurrently -p '{name}' -c red,yellow -n cw-app,cw-consumer 'pnpm -F ./packages/commonwealth start' 'pnpm -F ./packages/commonwealth start-consumer'
elif [ "$1" = "apps" ]; then
  concurrently -p '{name}' -c red,blue -n cw-app,snapshot-app 'pnpm -F ./packages/commonwealth start' 'pnpm -F ./packages/snapshot-listener start'
else
  pnpm start
fi;
