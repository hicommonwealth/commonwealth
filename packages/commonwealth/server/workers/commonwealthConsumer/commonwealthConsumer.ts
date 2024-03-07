import {
  HotShotsStats,
  PinoLogger,
  RabbitMQController,
  RabbitMQSubscription,
  RascalConfigServices,
  RascalSubscriptions,
  ServiceConsumer,
  ServiceKey,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import type { BrokerConfig } from 'rascal';
import { RABBITMQ_URI } from '../../config';

const log = logger(PinoLogger()).getLogger(__filename);
stats(HotShotsStats());

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

// CommonwealthConsumer is a server that consumes (and processes) RabbitMQ messages
// from external apps or services (like the Snapshot Service). It exists because we
// don't want to modify the Commonwealth database directly from external apps/services.
// You would use the script if you are starting an external service that transmits messages
// to the CommonwealthConsumer and you want to ensure that the CommonwealthConsumer is
// properly handling/processing those messages. Using the script is rarely necessary in
// local development.

export async function setupCommonwealthConsumer(): Promise<ServiceConsumer> {
  const { models } = await import('@hicommonwealth/model');
  const { processSnapshotMessage } = await import(
    './messageProcessors/snapshotConsumer'
  );

  let rmqController: RabbitMQController;
  try {
    rmqController = new RabbitMQController(
      <BrokerConfig>(
        getRabbitMQConfig(
          RABBITMQ_URI,
          RascalConfigServices.CommonwealthService,
        )
      ),
    );
    await rmqController.init();
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration',
    );
    throw e;
  }
  const context = {
    models,
    log,
  };

  const snapshotEventProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processSnapshotMessage,
    subscriptionName: RascalSubscriptions.SnapshotListener,
    msgProcessorContext: context,
  };

  const subscriptions: RabbitMQSubscription[] = [snapshotEventProcessorRmqSub];

  const serviceConsumer = new ServiceConsumer(
    'MainConsumer',
    rmqController,
    subscriptions,
  );
  await serviceConsumer.init();

  log.info(
    `Consumer started. Name: ${serviceConsumer.serviceName}, id: ${serviceConsumer.serviceId}`,
  );

  return serviceConsumer;
}

async function main() {
  try {
    log.info('Starting main consumer');
    await setupCommonwealthConsumer();
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
  isServiceHealthy = true;
}

if (process.argv[2] === 'run-as-script') {
  main();
}
