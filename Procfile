web: USE_NEW_CE_SYSTEM=true ts-node -P tsconfig.node.json -T server.ts
ceConsumer: node build/server/scripts/chainEventsConsumer.js
ceNode: node build/server/scripts/dbNode.js
release: npx sequelize-cli db:migrate --config server/sequelize.json
