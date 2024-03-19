import {
  PinoLogger,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { logger } from '@hicommonwealth/core';
import { DATABASE_URI } from '@hicommonwealth/model';
import createSubscriber from 'pg-listen';

const log = logger(PinoLogger()).getLogger(__filename);

const OUTBOX_CHANNEL = 'outbox-channel';
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

const subscriber = createSubscriber({ connectionString: DATABASE_URI });

subscriber.events.on('connected', () => {
  log.info('Message relayer connected to Postgres');
});

subscriber.events.on('reconnect', () => {
  log.warn('Message relayer reconnecting to Postgres');
});
subscriber.notifications.on(OUTBOX_CHANNEL, async (payload) => {
  relay();
});

subscriber.events.on('error', (error) => {
  log.fatal('Fatal database connection error:', error);
  isServiceHealthy = false;
  // restart dyno after multiple reconnection failures
  process.exit(1);
});

process.on('exit', () => {
  subscriber.close();
});

async function connectToPostgres() {
  await subscriber.connect();
  await subscriber.listenTo(OUTBOX_CHANNEL);
  isServiceHealthy = true;
}

async function relay() {}

async function main() {
  // init broker port (rabbitMQ)

  // use PG to start LISTEN command

  isServiceHealthy = true;

  // react to events inserted into Outbox by querying with FOR UPDATE SKIP LOCKED

  // In the same txn publish to RMQ

  // set relayed = true
}
