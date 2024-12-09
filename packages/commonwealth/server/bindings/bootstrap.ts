import {
  RabbitMQAdapter,
  RascalConfigServices,
  buildRetryStrategy,
  getRabbitMQConfig,
} from '@hicommonwealth/adapters';
import {
  Broker,
  BrokerSubscriptions,
  broker,
  logger,
  stats,
} from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  Contest,
  ContestWorker,
  DiscordBotPolicy,
  FarcasterWorker,
  User,
} from '@hicommonwealth/model';
import { config } from 'server/config';

const log = logger(import.meta);

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

export async function bootstrapBindings(): Promise<void> {
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
