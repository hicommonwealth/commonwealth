if [ "$1" = "all" ]; then
  echo "Starting app with all workers..."
  concurrently -p '{name}' -c red,green,blue,yellow -n app,relayer,consumer,evm 'pnpm -F commonwealth start' 'pnpm -F commonwealth start-message-relayer' 'pnpm -F commonwealth start-consumer' 'pnpm -F commonwealth start-evm-ce'
elif [ "$1" = "apps" ]; then
  echo "Starting app with snapshot listener..."
  concurrently -p '{name}' -c red,blue -n cw-app 'pnpm -F commonwealth start'
else
  pnpm -F commonwealth start
fi;
