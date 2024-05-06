import {
  getRabbitMQConfig,
  HotShotsStats,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  broker,
  Broker,
  BrokerSubscriptions,
  stats,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { fileURLToPath } from 'node:url';
import { RABBITMQ_URI } from '../../config';
import { NotificationsPolicy } from './notificationsPolicy';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

stats(HotShotsStats());

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: __filename.endsWith(process.argv[1]),
  service: ServiceKey.CommonwealthConsumer,
  // eslint-disable-next-line @typescript-eslint/require-await
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

async function startKnockWorker() {
  log.info('Starting Knock Worker');
  let brokerInstance: Broker;
  try {
    const rmqAdapter = new RabbitMQAdapter(
      getRabbitMQConfig(RABBITMQ_URI, RascalConfigServices.CommonwealthService),
    );
    await rmqAdapter.init();
    broker(rmqAdapter);
    brokerInstance = rmqAdapter;
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration',
    );
    throw e;
  }

  const sub = await brokerInstance.subscribe(
    BrokerSubscriptions.NotificationsProvider,
    NotificationsPolicy(),
  );

  if (!sub) {
    log.fatal(
      'Failed to subscribe to notifications. Requires restart!',
      undefined,
      {
        topic: BrokerSubscriptions.NotificationsProvider,
      },
    );
    process.exit(1);
  }

  isServiceHealthy = true;
  log.info('Knock Worker started');
}

if (import.meta.url.endsWith(process.argv[1])) {
  startKnockWorker().catch((err) => {
    log.fatal('A fatal error occurred with the Knock Worker', err);
    process.exit(1);
  });
}
