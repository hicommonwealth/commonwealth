import {
  HotShotsStats,
  KnockProvider,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  Broker,
  BrokerSubscriptions,
  broker,
  dispose,
  logger,
  notificationsProvider,
  stats,
} from '@hicommonwealth/core';
import { fileURLToPath } from 'url';
import { config } from '../../config';
import { NotificationsPolicy } from './notificationsPolicy';

const log = logger(import.meta);

stats(HotShotsStats());

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: fileURLToPath(import.meta.url).endsWith(process.argv[1]),
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
      getRabbitMQConfig(
        config.BROKER.RABBITMQ_URI,
        RascalConfigServices.CommonwealthService,
      ),
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

  // init Knock as notifications provider - this is necessary since the policies do not define the provider
  if (config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED)
    notificationsProvider(KnockProvider());
  else notificationsProvider();

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
    await dispose()('ERROR', true);
  }

  isServiceHealthy = true;
  log.info('Knock Worker started');
}

if (import.meta.url.endsWith(process.argv[1])) {
  startKnockWorker().catch((err) => {
    log.fatal('A fatal error occurred with the Knock Worker', err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
}
