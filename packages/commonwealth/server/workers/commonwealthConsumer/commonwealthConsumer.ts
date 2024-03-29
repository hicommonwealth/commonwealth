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
  Policy,
  broker,
  logger,
  schemas,
  stats,
} from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';
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

export async function setupCommonwealthConsumer(): Promise<void> {
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

  // snapshot policy
  const { processSnapshotProposalCreated } = await import(
    './messageProcessors/snapshotConsumer'
  );
  const snapshotInputs = {
    SnapshotProposalCreated: schemas.events.SnapshotProposalCreated,
  };
  const Snapshot: Policy<typeof snapshotInputs, ZodUndefined> = () => ({
    inputs: snapshotInputs,
    body: {
      SnapshotProposalCreated: processSnapshotProposalCreated,
    },
  });
  const snapshotSubRes = await brokerInstance.subscribe(
    BrokerTopics.SnapshotListener,
    Snapshot(),
  );

  const { processChainEventCreated } = await import(
    './messageProcessors/chainEventConsumer'
  );
  const chainEventInputs = {
    ChainEventCreated: schemas.events.ChainEventCreated,
  };
  const ChainEvent: Policy<typeof chainEventInputs, ZodUndefined> = () => ({
    inputs: chainEventInputs,
    body: {
      ChainEventCreated: processChainEventCreated,
    },
  });
  const chainEventSubRes = await brokerInstance.subscribe(
    BrokerTopics.ChainEvent,
    ChainEvent(),
  );

  if (!chainEventSubRes) {
    log.fatal(
      'Failed to subscribe to chain-events. Requires restart!',
      undefined,
      {
        topic: BrokerTopics.ChainEvent,
      },
    );
  }

  if (!snapshotSubRes) {
    log.fatal(
      'Failed to subscribe to snapshot events. Requires restart!',
      undefined,
      {
        topic: BrokerTopics.SnapshotListener,
      },
    );
  }

  if (!snapshotSubRes && !chainEventSubRes) {
    log.fatal('All subscriptions failed. Restarting...');
    process.exit(1);
  }
}

async function main() {
  try {
    log.info('Starting main consumer');
    await setupCommonwealthConsumer();
    isServiceHealthy = true;
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

if (process.argv[2] === 'run-as-script') {
  main();
}
