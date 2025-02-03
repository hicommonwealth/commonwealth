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
  handleEvent,
  logger,
  stats,
} from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  CommunityIndexerWorker,
  Contest,
  ContestWorker,
  DiscordBotPolicy,
  FarcasterWorker,
  User,
  models,
} from '@hicommonwealth/model';
import { EventNames } from '@hicommonwealth/schemas';
import { CronJob } from 'cron';
import { Client } from 'pg';
import { config } from 'server/config';
import { setupListener } from './pgListener';
import { incrementNumUnrelayedEvents, relayForever } from './relayForever';

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

export async function bootstrapBindings(
  skipRmqAdapter?: boolean,
): Promise<void> {
  let brokerInstance: Broker;
  try {
    const rmqAdapter = new RabbitMQAdapter(
      getRabbitMQConfig(
        config.BROKER.RABBITMQ_URI,
        RascalConfigServices.CommonwealthService,
      ),
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

  const communityIndexerSubRes = await brokerInstance.subscribe(
    BrokerSubscriptions.CommunityIndexerPolicy,
    CommunityIndexerWorker(),
  );
  checkSubscriptionResponse(
    communityIndexerSubRes,
    BrokerSubscriptions.CommunityIndexerPolicy,
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

  const userReferralsProjectionSubRes = await brokerInstance.subscribe(
    BrokerSubscriptions.UserReferrals,
    User.UserReferrals(),
  );
  checkSubscriptionResponse(
    userReferralsProjectionSubRes,
    BrokerSubscriptions.UserReferrals,
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
  const cronFrequency = '* * * * *';
  log.info(`Starting rollover cron job (${cronFrequency})`);

  CronJob.from({
    cronTime: cronFrequency, // every minute
    onTick: async () => {
      try {
        await handleEvent(ContestWorker(), {
          name: EventNames.ContestRolloverTimerTicked,
          payload: {},
        });
      } catch (err) {
        log.error(err);
      }
    },
    start: true,
  });
}

export function bootstrapCommunityIndexerLoop() {
  const cronFrequency = config.COMMUNITY_INDEXER.CRON!;
  if (!cronFrequency) {
    log.warn('Skipping community indexer cron job');
    return;
  }

  log.info(`Starting community cron job (${cronFrequency})`);

  CronJob.from({
    cronTime: cronFrequency,
    onTick: async () => {
      try {
        await handleEvent(CommunityIndexerWorker(), {
          name: EventNames.CommunityIndexerTimerTicked,
          payload: {},
        });
      } catch (err) {
        log.error(err);
      }
    },
    start: true,
  });
}
