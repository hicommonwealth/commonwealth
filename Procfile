web: USE_NEW_IDENTITY_CACHE=true ts-node -P tsconfig.node.json -T server.ts
ceConsumer: node build/server/scripts/chainEventsConsumer.js
ceNode: node build/server/scripts/dbNode.js
release: npx sequelize-cli db:migrate --config server/sequelize.json
