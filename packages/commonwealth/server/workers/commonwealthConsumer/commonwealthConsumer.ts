import {
  HotShotsStats,
  RabbitMQAdapter,
  RascalConfigServices,
  ServiceKey,
  buildRetryStrategy,
  getRabbitMQConfig,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import {
  Broker,
  BrokerSubscriptions,
  broker,
  handleEvent,
  logger,
  stats,
} from '@hicommonwealth/core';
import {
  Contest,
  ContestWorker,
  DiscordBotPolicy,
  FarcasterWorker,
  User,
} from '@hicommonwealth/model';
import { EventNames } from '@hicommonwealth/schemas';
import { fileURLToPath } from 'url';
import { config } from '../../config';
import { ChainEventPolicy } from './policies/chainEventCreated/chainEventCreatedPolicy';

const log = logger(import.meta);

stats({
  adapter: HotShotsStats(),
});

let isServiceHealthy = false;

startHealthCheckLoop({
  enabled: fileURLToPath(import.meta.url).endsWith(process.argv[1]),
  service: ServiceKey.CommonwealthConsumer,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

function checkSubscriptionResponse(
  subRes: boolean,
  topic: BrokerSubscriptions,
) {
  if (!subRes) {
    log.fatal(`Failed to subscribe to ${topic}. Requires restart!`, undefined, {
      topic,
    });
  }
}

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

  const chainEventSubRes = await brokerInstance.subscribe(
    BrokerSubscriptions.ChainEvent,
    ChainEventPolicy(),
  );
  checkSubscriptionResponse(chainEventSubRes, BrokerSubscriptions.ChainEvent);

  const contestWorkerSubRes = await brokerInstance.subscribe(
    BrokerSubscriptions.ContestWorkerPolicy,
    ContestWorker(),
    buildRetryStrategy(undefined, 20_000),
    {
      beforeHandleEvent: (topic, event, context) => {
        context.start = Date.now();
      },
      afterHandleEvent: (topic, event, context) => {
        const duration = Date.now() - context.start;
        const handler = `${topic}.${event.name}`;
        stats().histogram(`cw.handlerExecutionTime`, duration, { handler });
      },
    },
  );
  checkSubscriptionResponse(
    contestWorkerSubRes,
    BrokerSubscriptions.ContestWorkerPolicy,
  );

  const contestProjectionsSubRes = await brokerInstance.subscribe(
    BrokerSubscriptions.ContestProjection,
    Contest.Contests(),
  );
  checkSubscriptionResponse(
    contestProjectionsSubRes,
    BrokerSubscriptions.ContestProjection,
  );

  const xpProjectionSubRes = await brokerInstance.subscribe(
    BrokerSubscriptions.XpProjection,
    User.Xp(),
  );
  checkSubscriptionResponse(
    xpProjectionSubRes,
    BrokerSubscriptions.XpProjection,
  );

  const farcasterWorkerSubRes = await brokerInstance.subscribe(
    BrokerSubscriptions.FarcasterWorkerPolicy,
    FarcasterWorker(),
    buildRetryStrategy(undefined, 20_000),
  );
  checkSubscriptionResponse(
    farcasterWorkerSubRes,
    BrokerSubscriptions.FarcasterWorkerPolicy,
  );

  const discordBotSubRes = await brokerInstance.subscribe(
    BrokerSubscriptions.DiscordBotPolicy,
    DiscordBotPolicy(),
  );
  checkSubscriptionResponse(
    discordBotSubRes,
    BrokerSubscriptions.DiscordBotPolicy,
  );
}

function startRolloverLoop() {
  log.info('Starting rollover loop');

  const loop = async () => {
    try {
      await handleEvent(ContestWorker(), {
        name: EventNames.ContestRolloverTimerTicked,
        payload: {},
      });
    } catch (err) {
      log.error(err);
    }
  };

  // TODO: move to external service triggered via scheduler?
  setInterval(() => {
    loop().catch(console.error);
  }, 1_000 * 60);
}

async function main() {
  try {
    log.info('Starting main consumer');
    await setupCommonwealthConsumer();
    isServiceHealthy = true;
    startRolloverLoop();
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main();
}
