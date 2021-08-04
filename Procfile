web: ts-node -P tsconfig.node.json -T server.ts
ceConsumer: HANDLE_IDENTITY=publish node build/server/scripts/setupChainEventListeners.js
ceNode0: REPEAT_TIME=1 WORKER_NUMBER=8 NUM_WORKERS=26 NODE_ENV=production HANDLE_IDENTITY=publish node build/server/scripts/dbNode.js
release: npx sequelize-cli db:migrate --config server/sequelize.json
