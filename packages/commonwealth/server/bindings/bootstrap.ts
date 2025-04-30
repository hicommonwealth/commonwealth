import { RabbitMQAdapter, createRmqConfig } from '@hicommonwealth/adapters';
import {
  Broker,
  EventSchemas,
  EventsHandlerMetadata,
  RetryStrategyFn,
  broker,
  handleEvent,
  logger,
} from '@hicommonwealth/core';
import { ContestWorker, models } from '@hicommonwealth/model';
import { Client } from 'pg';
import { config } from 'server/config';
import { setupListener } from './pgListener';
import { rascalConsumerMap } from './rascalConsumerMap';
import { incrementNumUnrelayedEvents, relayForever } from './relayForever';

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

    if (typeof item === 'function') consumer = item;
    else {
      consumer = item.consumer;
      worker = item.worker;
      retryStrategy = item.retryStrategy;
    }

    // match worker name
    if ((options?.worker || '') !== (worker || '')) continue;
    await brokerInstance.subscribe(consumer, retryStrategy);
  }
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
