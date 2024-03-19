import {
  getRabbitMQConfig,
  PinoLogger,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { broker, logger } from '@hicommonwealth/core';
import { RABBITMQ_URI } from '../../config';
import { connectToPostgres, setupSubscriber } from './pgListener';
import { incrementNumUnrelayedEvents, relayForever } from './relayForever';

const log = logger(PinoLogger()).getLogger(__filename);

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

function setServiceHealthy(healthy: boolean) {
  isServiceHealthy = healthy;
}

async function startMessageRelayer(maxRelayIterations?: number) {
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

  incrementNumUnrelayedEvents(
    await models.Outbox.count({
      where: {
        relayed: false,
      },
    }),
  );

  const subscriber = setupSubscriber(setServiceHealthy);
  await connectToPostgres(subscriber, setServiceHealthy);

  isServiceHealthy = true;
  return relayForever(maxRelayIterations);
}

if (require.main === module) {
  startMessageRelayer().catch((err) => {
    log.fatal('Unknown error fatal requires immediate attention', err);
  });
}
