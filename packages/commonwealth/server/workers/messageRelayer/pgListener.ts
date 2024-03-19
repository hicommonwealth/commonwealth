import { PinoLogger } from '@hicommonwealth/adapters';
import { logger } from '@hicommonwealth/core';
import { DATABASE_URI } from '@hicommonwealth/model';
import createSubscriber, { Subscriber } from 'pg-listen';
import { incrementNumUnrelayedEvents } from './relayForever';

const log = logger(PinoLogger()).getLogger(__filename);
const OUTBOX_CHANNEL = 'outbox-channel';

export function setupSubscriber(
  setServiceHealthy: (healthy: boolean) => void,
): Subscriber<Record<string, any>> {
  const subscriber = createSubscriber({ connectionString: DATABASE_URI });

  subscriber.events.on('connected', () => {
    log.info('Message relayer connected to Postgres');
  });

  subscriber.events.on('reconnect', () => {
    // log error so it is reported to rollbar
    // frequent reconnections could indicate an issue
    log.error('Message relayer reconnecting to Postgres');
  });
  subscriber.notifications.on(OUTBOX_CHANNEL, async () => {
    incrementNumUnrelayedEvents(1);
  });

  subscriber.events.on('error', (error) => {
    log.fatal('Fatal database connection error:', error);
    setServiceHealthy(false);
    // restart dyno after multiple reconnection failures
    process.exit(1);
  });

  process.on('exit', () => {
    subscriber.close();
  });

  return subscriber;
}

export async function connectToPostgres(
  subscriber: Subscriber<Record<string, any>>,
  setServiceHealthy: (healthy: boolean) => void,
) {
  await subscriber.connect();
  await subscriber.listenTo(OUTBOX_CHANNEL);
  setServiceHealthy(true);
}
