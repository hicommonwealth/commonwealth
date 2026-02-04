import { RabbitMQAdapter, createRmqConfig } from '@hicommonwealth/adapters';
import {
  Broker,
  ConsumerHooks,
  EventSchemas,
  EventsHandlerMetadata,
  RetryStrategyFn,
  broker,
  handleEvent,
  logger,
  stats,
} from '@hicommonwealth/core';
import { ContestWorker } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { config } from 'server/config';
import { rascalConsumerMap } from './rascalConsumerMap';
import { relayForever } from './relayForever';
import { isShutdownInProgress, registerWorker } from './workerLifecycle';

const log = logger(import.meta);

export async function bootstrapBindings(options?: {
  skipRmqAdapter?: boolean;
  worker?: string;
}): Promise<void> {
  let brokerInstance: Broker;
  try {
    const rmqAdapter = new RabbitMQAdapter(
      createRmqConfig({
        rabbitMqUri: config.BROKER.RABBITMQ_URI,
        map: rascalConsumerMap,
      }),
    );
    await rmqAdapter.init();
    if (!options?.skipRmqAdapter) {
      broker({ adapter: rmqAdapter });
    }

    await rmqAdapter.subscribeDlqHandler(
      async ({ consumer, event_id, ...dlq }) => {
        await models.Dlq.findOrCreate({
          where: { consumer, event_id },
          defaults: { consumer, event_id, ...dlq },
        });
      },
    );

    brokerInstance = rmqAdapter;
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration',
    );
    throw e;
  }

  for (const item of rascalConsumerMap) {
    let consumer: () => EventsHandlerMetadata<EventSchemas>;
    let worker: string | undefined;
    let retryStrategy: RetryStrategyFn | undefined;
    let hooks: ConsumerHooks | undefined;

    if (typeof item === 'function') consumer = item;
    else {
      consumer = item.consumer;
      worker = item.worker;
      retryStrategy = item.retryStrategy;
      hooks = item.hooks;
    }

    // match worker name (options.worker defined in rascalConsumerMap)
    if ((options?.worker || '') !== (worker || '')) continue;
    // policies run on the Commonwealth consumer by default
    await brokerInstance.subscribe(consumer, retryStrategy, hooks);
  }
}

export async function bootstrapRelayer(
  maxRelayIterations?: number,
): Promise<void> {
  const statsInterval = setInterval(() => {
    // Report Outbox stats once per minute
    models.Outbox.count({
      where: { relayed: false },
    })
      .then((count) => {
        stats().gauge('messageRelayerNumUnrelayedEvents', count);
      })
      .catch((err) => {
        log.error('Failed to update Outbox stats', err);
      });
  }, 60_000);

  // Register cleanup for the stats interval
  registerWorker('message-relayer-stats', () => {
    clearInterval(statsInterval);
  });

  // Note: relayForever checks isShutdownInProgress() and will stop on its own
  relayForever(maxRelayIterations).catch((err) => {
    // Only log fatal if not during shutdown
    if (!isShutdownInProgress()) {
      log.fatal(
        'Unknown fatal error requires immediate attention. Restart REQUIRED!',
        err,
      );
    }
  });
}

export function bootstrapContestRolloverLoop() {
  log.info('Starting rollover loop');

  const loop = async () => {
    if (isShutdownInProgress()) return;
    try {
      await handleEvent(ContestWorker(), {
        id: 0,
        name: 'ContestRolloverTimerTicked',
        payload: {},
      });
    } catch (err) {
      log.error(err);
    }
  };

  // TODO: move to external service triggered via scheduler?
  const rolloverInterval = setInterval(() => {
    loop().catch(console.error);
  }, 1_000 * 60);

  registerWorker('contest-rollover-loop', () => {
    clearInterval(rolloverInterval);
    log.info('Contest rollover loop stopped');
  });
}
