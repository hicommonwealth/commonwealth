web: ts-node -P tsconfig.node.json -T server.ts
worker: RUN_AS_LISTENER=true ts-node --log-error --project tsconfig.node.json server.ts
ceNode6: WORKER_NUMBER=6 NUM_WORKERS=29 NODE_ENV=production HANDLE_IDENTITY=publish ts-node -T scripts/dbNode.ts
release: npx sequelize-cli db:migrate --config server/sequelize.json
