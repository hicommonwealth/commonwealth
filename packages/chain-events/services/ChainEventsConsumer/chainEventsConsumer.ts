import type { BrokerConfig } from 'rascal';
import type { RabbitMQSubscription } from 'common-common/src/serviceConsumer';
import { ServiceConsumer } from 'common-common/src/serviceConsumer';
import { factory, formatFilename } from 'common-common/src/logging';
import {
  RabbitMQController,
  getRabbitMQConfig,
  RascalSubscriptions,
} from 'common-common/src/rabbitmq';
import Rollbar from 'rollbar';
import { SubstrateTypes } from 'chain-events/src/types';

import models from '../database/database';
import { RABBITMQ_URI, ROLLBAR_ENV, ROLLBAR_SERVER_TOKEN } from '../config';

import EventStorageHandler from './ChainEventHandlers/storage';
import NotificationsHandler from './ChainEventHandlers/notification';
import EntityArchivalHandler from './ChainEventHandlers/entityArchival';
import type { Ithis as ChainEventsProcessorContextType } from './MessageProcessors/ChainEventsQueue';
import { processChainEvents } from './MessageProcessors/ChainEventsQueue';
import v8 from 'v8';

const log = factory.getLogger(formatFilename(__filename));

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

/**
 * This functions initializes a single RabbitMQController instance and then subscribes to ChainCUD messages coming
 * from the {@link RascalSubscriptions.ChainEvents}
 * subscriptions. The function also runs RepublishMessages which periodically republishes data stored in the database
 * that was previously unsuccessfully published.
 */
export async function setupChainEventConsumer(): Promise<ServiceConsumer> {
  let rollbar;
  if (ROLLBAR_SERVER_TOKEN) {
    rollbar = new Rollbar({
      accessToken: ROLLBAR_SERVER_TOKEN,
      environment: ROLLBAR_ENV,
      captureUncaught: true,
      captureUnhandledRejections: true,
    });
  }

  let rmqController: RabbitMQController;
  try {
    rmqController = new RabbitMQController(
      <BrokerConfig>getRabbitMQConfig(RABBITMQ_URI),
      rollbar
    );
    await rmqController.init();
  } catch (e) {
    log.error(
      'Rascal consumer setup failed. Please check the Rascal configuration'
    );
    throw e;
  }

  // writes events into the db as ChainEvents rows
  const storageHandler = new EventStorageHandler(models, rmqController);

  // creates and updates ChainEntity rows corresponding with entity-related events
  const entityArchivalHandler = new EntityArchivalHandler(
    models,
    rmqController
  );

  const excludedNotificationEvents = [SubstrateTypes.EventKind.DemocracyTabled];
  const notificationsHandler = new NotificationsHandler(
    models,
    rmqController,
    excludedNotificationEvents
  );

  // WARNING: due to dbEvent in each handler ORDER OF HANDLERS MATTERS!
  const allChainEventHandlers = [
    storageHandler,
    entityArchivalHandler,
    notificationsHandler,
  ];

  // setup Chain
  const chainEventsProcessorContext: ChainEventsProcessorContextType = {
    allChainEventHandlers,
    log,
  };
  const chainEventsProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainEvents,
    subscriptionName: RascalSubscriptions.ChainEvents,
    msgProcessorContext: chainEventsProcessorContext,
  };

  const subscriptions: RabbitMQSubscription[] = [chainEventsProcessorRmqSub];

  const serviceConsumer = new ServiceConsumer(
    'ChainEventsConsumer',
    rmqController,
    subscriptions
  );
  await serviceConsumer.init();

  // TODO: turn this on if needed later - leaving off for now as it may not produce an optimal retrying strategy
  //  and can dilute the retry message data/stats we get on datadog
  // const republishMessages = new RepublishMessages(rmqController, models);
  // await republishMessages.run();

  log.info('Consumer started');

  return serviceConsumer;
}

/**
 * Entry point for the ChainEventsConsumer server
 */
async function main() {
  try {
    log.info('Starting consumer...');
    await setupChainEventConsumer();
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

if (process.argv[2] === 'run-as-script') main();
