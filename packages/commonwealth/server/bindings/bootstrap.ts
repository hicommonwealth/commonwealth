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
  Contest,
  ContestWorker,
  CreateUnverifiedUser,
  DiscordBotPolicy,
  FarcasterWorker,
  LaunchpadPolicy,
  NominationsWorker,
  NotificationsPolicy,
  TwitterEngagementPolicy,
  User,
  models,
} from '@hicommonwealth/model';
import { Client } from 'pg';
import { config } from 'server/config';
import { NotificationsSettingsPolicy } from 'server/workers/knock/NotificationsSettings.policy';
import { setupListener } from './pgListener';
import { rascalConsumerMap } from './rascalConsumerMap';
import { incrementNumUnrelayedEvents, relayForever } from './relayForever';

const log = logger(import.meta);

export async function bootstrapBindings(
  skipRmqAdapter?: boolean,
  knockWorker?: boolean,
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

  if (knockWorker) {
    await brokerInstance.subscribe(
      NotificationsPolicy,
      // This disables retry strategies on any handler error/failure
      // This is because we cannot guarantee whether a Knock workflow trigger
      // call was successful or not. It is better to 'miss' notifications then
      // to double send a notification
      buildRetryStrategy((err, topic, content, ackOrNackFn, log_) => {
        log_.error(err.message, err, {
          topic,
          message: content,
        });
        ackOrNackFn({ strategy: 'ack' });
        return true;
      }),
    );
    await brokerInstance.subscribe(NotificationsSettingsPolicy);
    return;
  }

  await brokerInstance.subscribe(ChainEventPolicy);
  await brokerInstance.subscribe(
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
  await brokerInstance.subscribe(NominationsWorker);
  await brokerInstance.subscribe(Contest.Contests);
  await brokerInstance.subscribe(User.Xp);
  await brokerInstance.subscribe(
    FarcasterWorker,
    buildRetryStrategy(undefined, 20_000),
  );
  await brokerInstance.subscribe(DiscordBotPolicy);
  await brokerInstance.subscribe(LaunchpadPolicy);
  await brokerInstance.subscribe(CreateUnverifiedUser);
  await brokerInstance.subscribe(TwitterEngagementPolicy);
  await brokerInstance.subscribe(CommunityGoalsPolicy);
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
