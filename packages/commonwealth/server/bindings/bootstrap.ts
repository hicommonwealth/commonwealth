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
  CommunityGoalsPolicy,
  CommunityIndexerWorker,
  Contest,
  ContestWorker,
  CreateUnverifiedUser,
  DiscordBotPolicy,
  FarcasterWorker,
  TwitterEngagementPolicy,
  User,
  models,
} from '@hicommonwealth/model';
import { CronJob } from 'cron';
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

  const communityIndexerSubRes = await brokerInstance.subscribe(
    CommunityIndexerWorker,
  );
  checkSubscriptionResponse(
    communityIndexerSubRes,
    CommunityIndexerWorker.name,
  );

  const contestProjectionsSubRes = await brokerInstance.subscribe(
    Contest.Contests,
  );
  checkSubscriptionResponse(contestProjectionsSubRes, Contest.Contests.name);

  const xpProjectionSubRes = await brokerInstance.subscribe(User.Xp);
  checkSubscriptionResponse(xpProjectionSubRes, User.Xp.name);

  const farcasterWorkerSubRes = await brokerInstance.subscribe(
    FarcasterWorker,
    buildRetryStrategy(undefined, 20_000),
  );
  checkSubscriptionResponse(farcasterWorkerSubRes, FarcasterWorker.name);

  const discordBotSubRes = await brokerInstance.subscribe(DiscordBotPolicy);
  checkSubscriptionResponse(discordBotSubRes, DiscordBotPolicy.name);

  const createUnverifiedUserSubRes =
    await brokerInstance.subscribe(CreateUnverifiedUser);
  checkSubscriptionResponse(
    createUnverifiedUserSubRes,
    CreateUnverifiedUser.name,
  );

  const twitterEngSubRes = await brokerInstance.subscribe(
    TwitterEngagementPolicy,
  );
  checkSubscriptionResponse(twitterEngSubRes, TwitterEngagementPolicy.name);
  const createCommunityGoalsSubRes =
    await brokerInstance.subscribe(CommunityGoalsPolicy);
  checkSubscriptionResponse(
    createCommunityGoalsSubRes,
    CommunityGoalsPolicy.name,
  );
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
  const cronFrequency = '* * * * *'; // every minute

  log.info(`Starting rollover cron job (${cronFrequency})`);

  CronJob.from({
    cronTime: cronFrequency,
    onTick: async () => {
      try {
        await handleEvent(ContestWorker(), {
          name: 'ContestRolloverTimerTicked',
          payload: {},
        });
      } catch (err) {
        log.error(err);
      }
    },
    start: true,
  });
}
