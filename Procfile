web: ts-node -P tsconfig.node.json -T server.ts
ceConsumer: HANDLE_IDENTITY=publish ts-node --project tsconfig.node.json server/scripts/setupChainEventListeners.ts
ceNode0: WORKER_NUMBER=4 NUM_WORKERS=24 NODE_ENV=production HANDLE_IDENTITY=publish ts-node -T server/scripts/dbNode.ts
release: npx sequelize-cli db:migrate --config server/sequelize.json
