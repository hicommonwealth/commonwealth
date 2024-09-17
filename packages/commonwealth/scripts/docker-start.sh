# start.sh

if [[ $DYNO == "web"* ]]; then
  NODE_ENV=production node --import=extensionless/register --enable-source-maps ./build/server.js
elif [[ $DYNO == "consumer"* ]]; then
  node --import=extensionless/register build/server/workers/commonwealthConsumer/commonwealthConsumer.js
elif [[ $DYNO == "evm-ce"* ]]; then
  node --import=extensionless/register build/server/workers/evmChainEvents/startEvmPolling.js
elif [[ $DYNO == "knock"* ]]; then
  node --import=extensionless/register build/server/workers/knock/knockWorker.js
elif [[ $DYNO == "message-relayer"* ]]; then
  node --import=extensionless/register build/server/workers/messageRelayer/messageRelayer.js
elif [[ $DYNO == "release"* ]]; then
  node --import=extensionless/register build/server/scripts/releasePhaseEnvCheck.js && \
  npx sequelize-cli db:migrate --config server/sequelize.json && \
  node --import=extensionless/register build/server/scripts/purgeCloudflareCache.js
fi