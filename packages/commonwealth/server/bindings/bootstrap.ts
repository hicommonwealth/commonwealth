import {
  RabbitMQAdapter,
  buildRetryStrategy,
  createRmqConfig,
} from '@hicommonwealth/adapters';
import {
  Broker,
  broker,
  handleEvent,
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
  models,
} from '@hicommonwealth/model';
import { Client } from 'pg';
import { config } from 'server/config';
import { setupListener } from './pgListener';
import { rascalConsumerMap } from './rascalConsumerMap';
import { incrementNumUnrelayedEvents, relayForever } from './relayForever';

const log = logger(import.meta);

function checkSubscriptionResponse(subRes: boolean, topic: string) {
  if (!subRes) {
    log.fatal(`Failed to subscribe to ${topic}. Requires restart!`, undefined, {
      topic,
    });
  }
}

export async function bootstrapBindings(
  skipRmqAdapter?: boolean,
): Promise<void> {
  let brokerInstance: Broker;
  try {
    const rmqAdapter = new RabbitMQAdapter(
      createRmqConfig({
        rabbitMqUri: config.BROKER.RABBITMQ_URI,
        map: rascalConsumerMap,
      }),
    );
    await rmqAdapter.init();
    if (!skipRmqAdapter) {
      broker({
        adapter: rmqAdapter,
      });
    }
    brokerInstance = rmqAdapter;
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration',
    );
    throw e;
  }

  const chainEventSubRes = await brokerInstance.subscribe(ChainEventPolicy);
  checkSubscriptionResponse(chainEventSubRes, ChainEventPolicy.name);

  const contestWorkerSubRes = await brokerInstance.subscribe(
    ContestWorker,
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
  checkSubscriptionResponse(contestWorkerSubRes, ContestWorker.name);

  const contestProjectionsSubRes = await brokerInstance.subscribe(
    Contest.Contests,
  );
  checkSubscriptionResponse(contestProjectionsSubRes, Contest.Contests.name);

  const xpProjectionSubRes = await brokerInstance.subscribe(User.Xp);
  checkSubscriptionResponse(xpProjectionSubRes, User.Xp.name);

  const userReferralsProjectionSubRes = await brokerInstance.subscribe(
    User.UserReferrals,
  );
  checkSubscriptionResponse(
    userReferralsProjectionSubRes,
    User.UserReferrals.name,
  );

  const farcasterWorkerSubRes = await brokerInstance.subscribe(
    FarcasterWorker,
    buildRetryStrategy(undefined, 20_000),
  );
  checkSubscriptionResponse(farcasterWorkerSubRes, FarcasterWorker.name);

  const discordBotSubRes = await brokerInstance.subscribe(DiscordBotPolicy);
  checkSubscriptionResponse(discordBotSubRes, DiscordBotPolicy.name);
}

export async function bootstrapRelayer(
  maxRelayIterations?: number,
): Promise<Client> {
  const count = await models.Outbox.count({
    where: { relayed: false },
  });
  incrementNumUnrelayedEvents(count);

  const pgClient = await setupListener();

  relayForever(maxRelayIterations).catch((err) => {
    log.fatal(
      'Unknown fatal error requires immediate attention. Restart REQUIRED!',
      err,
    );
  });

  return pgClient;
}

export function bootstrapContestRolloverLoop() {
  log.info('Starting rollover loop');

  const loop = async () => {
    try {
      await handleEvent(ContestWorker(), {
        name: 'ContestRolloverTimerTicked',
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
