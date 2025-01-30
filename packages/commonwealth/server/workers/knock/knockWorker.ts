import {
  buildRetryStrategy,
  getRabbitMQConfig,
  HotShotsStats,
  KnockProvider,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  Broker,
  broker,
  BrokerSubscriptions,
  dispose,
  logger,
  notificationsProvider,
  stats,
} from '@hicommonwealth/core';
import { NotificationsPolicy } from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
import { config } from '../../config';
import { NotificationsSettingsPolicy } from './NotificationsSettings.policy';

const log = logger(import.meta);

stats({
  adapter: HotShotsStats(),
});

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
    broker({
      adapter: rmqAdapter,
    });
    brokerInstance = rmqAdapter;
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration',
    );
    throw e;
  }

  // init Knock as notifications provider - this is necessary since the policies do not define the provider
  if (config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED)
    notificationsProvider({
      adapter: KnockProvider(),
    });
  else notificationsProvider();

  const sub = await brokerInstance.subscribe(
    BrokerSubscriptions.NotificationsProvider,
    NotificationsPolicy(),
    // This disables retry strategies on any handler error/failure
    // This is because we cannot guarantee whether a Knock workflow trigger
    // call was successful or not. It is better to 'miss' notifications then
    // to double send a notification
    buildRetryStrategy((err, topic, content, ackOrNackFn, log_) => {
      log_.error(err.message, err, {
        topic,
        message: content,
      });
      ackOrNackFn({ strategy: 'ack' });
      return true;
    }),
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

  const settingsSub = await brokerInstance.subscribe(
    BrokerSubscriptions.NotificationsSettings,
    NotificationsSettingsPolicy(),
  );

  if (!settingsSub) {
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
