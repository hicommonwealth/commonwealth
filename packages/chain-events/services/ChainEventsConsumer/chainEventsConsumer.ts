import {BrokerConfig} from 'rascal';
import {
  RabbitMQSubscription,
  ServiceConsumer,
} from 'common-common/src/ServiceConsumer';
import EventStorageHandler from './ChainEventHandlers/storage';
import NotificationsHandler from './ChainEventHandlers/notification';
import EntityArchivalHandler from './ChainEventHandlers/entityArchival';
import {factory, formatFilename} from 'common-common/src/logging';
import {RabbitMQController, getRabbitMQConfig, RascalSubscriptions} from 'common-common/src/rabbitmq';
import models from '../database/database';
import {RABBITMQ_URI} from '../config';
import {
  Ithis as ChainEventsProcessorContextType,
  processChainEvents,
} from './MessageProcessors/ChainEventsQueue';
import {SubstrateTypes} from '../../src';
import {RepublishMessages} from "./republishMessages";

const log = factory.getLogger(formatFilename(__filename));

/**
 * This functions initializes a single RabbitMQController instance and then subscribes to ChainCUD messages coming
 * from the {@link RascalSubscriptions.ChainEvents}
 * subscriptions. This is equivalent The function also runs RepublishMessages which periodically republishes data stored in the database
 * that was previously unsuccessfully published.
 */
async function setupChainEventConsumer() {
  let rmqController: RabbitMQController;
  try {
    rmqController = new RabbitMQController(
      <BrokerConfig>getRabbitMQConfig(RABBITMQ_URI)
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
    notificationsHandler,
    entityArchivalHandler,
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

  let subscriptions: RabbitMQSubscription[] = [
    chainEventsProcessorRmqSub,
  ];

  const serviceConsumer = new ServiceConsumer(
    'ChainEventsConsumer',
    rmqController,
    subscriptions
  );
  await serviceConsumer.init();

  const republishMessages = new RepublishMessages(rmqController, models);
  await republishMessages.run();

  log.info('Consumer started');
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

main();
