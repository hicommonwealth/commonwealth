import {
  HotShotsStats,
  PinoLogger,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  Broker,
  BrokerTopics,
  broker,
  events,
  logger,
  stats,
} from '@hicommonwealth/core';
import type { BrokerConfig } from 'rascal';
import { RABBITMQ_URI } from '../../config';
import { processSnapshotProposalCreated } from './messageProcessors/snapshotConsumer';

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

export async function setupCommonwealthConsumer(): Promise<void> {
  let brokerInstance: Broker;
  try {
    const rmqController = new RabbitMQAdapter(
      <BrokerConfig>(
        getRabbitMQConfig(
          RABBITMQ_URI,
          RascalConfigServices.CommonwealthService,
        )
      ),
    );
    await rmqController.init();
    broker(rmqController);
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration',
    );
    throw e;
  }

  const result = await brokerInstance.subscribe(BrokerTopics.SnapshotListener, {
    inputs: {
      SnapshotProposalCreated: events.schemas.SnapshotProposalCreated,
    },
    body: {
      SnapshotProposalCreated: processSnapshotProposalCreated,
    },
  });

  if (!result) {
    throw new Error(`Failed to subscribe to ${BrokerTopics.SnapshotListener}`);
  }
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
