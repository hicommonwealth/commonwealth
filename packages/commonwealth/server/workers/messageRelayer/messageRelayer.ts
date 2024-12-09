import {
  getRabbitMQConfig,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { broker, logger } from '@hicommonwealth/core';
import { bootstrapRelayer } from 'server/bindings/bootstrap';
import { config } from '../../config';

const log = logger(import.meta);

const isServiceHealthy = false;

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
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration',
    );
    throw e;
  }

  await bootstrapRelayer(maxRelayIterations);
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
