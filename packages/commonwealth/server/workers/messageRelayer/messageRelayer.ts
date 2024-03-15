// set health check

import { ServiceKey, startHealthCheckLoop } from '@hicommonwealth/adapters';

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: require.main === module,
  service: ServiceKey.CommonwealthConsumer,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

async function main() {
  // init broker port (rabbitMQ)

  // use PG to start LISTEN command

  isServiceHealthy = true;

  // react to events inserted into Outbox by querying with FOR UPDATE SKIP LOCKED

  // In the same txn publish to RMQ

  // set relayed = true
}
