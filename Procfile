web: ts-node -P tsconfig.node.json -T server.ts
ceConsumer: HANDLE_IDENTITY=publish node build/server/scripts/setupChainEventListeners.js
ceNode0: WORKER_NUMBER=4 NUM_WORKERS=24 NODE_ENV=production HANDLE_IDENTITY=publish node build/server/scripts/dbNode.js
release: npx sequelize-cli db:migrate --config server/sequelize.json
