web: ts-node -P tsconfig.node.json -T server.ts
ceConsumer: node build/server/scripts/setupChainEventListeners.js
ceNode0: WORKER_NUMBER=0 node build/server/scripts/dbNode.js
ceNode1: WORKER_NUMBER=1 node build/server/scripts/dbNode.js
ceNode2: WORKER_NUMBER=2 node build/server/scripts/dbNode.js
release: npx sequelize-cli db:migrate --config server/sequelize.json
