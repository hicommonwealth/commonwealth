import {
  getRabbitMQConfig,
  PinoLogger,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { broker, logger } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { RABBITMQ_URI } from '../../config';
import { setupListener } from './pgListener';
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

  const count = parseInt(
    (
      await models.sequelize.query<{ count: string }>(
        `
        SELECT COUNT(*) FROM "Outbox";
      `,
        { type: QueryTypes.SELECT, raw: true },
      )
    )[0].count,
  );
  incrementNumUnrelayedEvents(count);

  await setupListener();

  isServiceHealthy = true;
  return relayForever(maxRelayIterations);
}

if (require.main === module) {
  startMessageRelayer().catch((err) => {
    log.fatal('Unknown error fatal requires immediate attention', err);
  });
}
