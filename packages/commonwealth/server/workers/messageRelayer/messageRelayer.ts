import {
  getRabbitMQConfig,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { broker } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { fileURLToPath } from 'node:url';
import { RABBITMQ_URI } from '../../config';
import { setupListener } from './pgListener';
import { incrementNumUnrelayedEvents, relayForever } from './relayForever';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: import.meta.url.endsWith(process.argv[1]),
  service: ServiceKey.CommonwealthConsumer,
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
      getRabbitMQConfig(RABBITMQ_URI, RascalConfigServices.CommonwealthService),
    );
    await rmqAdapter.init();
    broker(rmqAdapter);
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

  await setupListener();

  isServiceHealthy = true;
  return relayForever(maxRelayIterations);
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
