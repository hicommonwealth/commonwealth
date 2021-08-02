web: ts-node -P tsconfig.node.json -T server.ts
ceConsumer: HANDLE_IDENTITY=publish RUN_AS_LISTENER=true ts-node --log-error --project tsconfig.node.json server.ts
ceNode0: WORKER_NUMBER=4 NUM_WORKERS=24 NODE_ENV=production HANDLE_IDENTITY=publish ts-node -T scripts/dbNode.ts
release: npx sequelize-cli db:migrate --config server/sequelize.json
