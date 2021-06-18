web: ts-node -P tsconfig.node.json -T server.ts
worker: RUN_AS_LISTENER=true ts-node --log-error --project tsconfig.node.json server/scripts/listenChainEvents.ts
release: npx sequelize-cli db:migrate --config server/sequelize.json
