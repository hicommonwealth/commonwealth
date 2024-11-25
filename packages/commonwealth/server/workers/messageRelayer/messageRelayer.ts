import {
  getRabbitMQConfig,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { broker, logger } from '@hicommonwealth/core';
import { config } from '../../config';
import { setupListener } from './pgListener';
import { incrementNumUnrelayedEvents, relayForever } from './relayForever';

const log = logger(import.meta);

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: import.meta.url.endsWith(process.argv[1]),
  service: ServiceKey.MessageRelayer,
  // eslint-disable-next-line @typescript-eslint/require-await
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

export async function startMessageRelayer(maxRelayIterations?: number) {
  const { models } = await import('@hicommonwealth/model');

  try {
    const rmqAdapter = new RabbitMQAdapter(
      getRabbitMQConfig(
        config.BROKER.RABBITMQ_URI,
        RascalConfigServices.CommonwealthService,
      ),
    );
    await rmqAdapter.init();
    broker({
      key: 'w.w.w',
      adapter: rmqAdapter,
      isDefault: true,
    });
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration',
    );
    throw e;
  }

  const count = await models.Outbox.count({
    where: {
      relayed: false,
    },
  });
  incrementNumUnrelayedEvents(count);

  const pgClient = await setupListener();

  isServiceHealthy = true;
  relayForever(maxRelayIterations).catch((err) => {
    log.fatal(
      'Unknown error fatal requires immediate attention. Restart REQUIRED!',
      err,
    );
  });

  return pgClient;
}

if (import.meta.url.endsWith(process.argv[1])) {
  startMessageRelayer().catch((err) => {
    log.fatal(
      'Unknown error fatal requires immediate attention. Restart REQUIRED!',
      err,
    );
    // if we process.exit(1) here we start an infinite loop of retrying to publish events
  });
}
