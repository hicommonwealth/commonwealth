ceConsumer: HANDLE_IDENTITY=publish node build/server/scripts/setupChainEventListeners.js
ceNode0: INFURA_API_KEY=8e25780c4d574b3cbf53c306a841d09f REPEAT_TIME=1 WORKER_NUMBER=0 NUM_WORKERS=1 NODE_ENV=production HANDLE_IDENTITY=publish node build/server/scripts/dbNode.js
release: npx sequelize-cli db:migrate --config server/sequelize.json
