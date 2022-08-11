import { BrokerConfig, SubscriberSessionAsPromised } from "rascal";
import getRabbitMQConfig from "common-common/src/rabbitmq/RabbitMQConfig";
import { RabbitMQSubscription, ServiceConsumer } from "common-common/src/ServiceConsumer";
import EventStorageHandler from "./ChainEventHandlers/storage";
import EntityArchivalHandler from "./ChainEventHandlers/entityArchival";
import { ChainBase } from "common-common/src/types";
import { factory, formatFilename } from "common-common/src/logging";
import { RabbitMQController } from "common-common/src/rabbitmq/rabbitMQController";
import { RascalSubscriptions } from "common-common/src/rabbitmq/types";
import models from "../app/database";
import { RABBITMQ_URI } from "../config";
import { processChainEvents, Ithis as CeProcessorContextType } from "./MessageProcessors/ChainEventsQueue";


// TODO: move userFlags, profileCreation, and notificationHandler to main service

const log = factory.getLogger(formatFilename(__filename));

async function setupChainEventConsumers() {

  let rmqController: RabbitMQController
  try {
    rmqController = new RabbitMQController(<BrokerConfig>getRabbitMQConfig(RABBITMQ_URI));
    await rmqController.init();
  } catch (e) {
    log.error("Rascal consumer setup failed. Please check the Rascal configuration");
    throw e
  }

  // TODO: move this
  // emits notifications by writing into the db's Notifications table, and also optionally
  // sending a notification to the client via websocket
  // const excludedNotificationEvents = [SubstrateTypes.EventKind.DemocracyTabled];
  // const notificationHandler = new EventNotificationHandler(
  //   models,
  //   wss,
  //   excludedNotificationEvents,
  //   consumer
  // );

  // writes events into the db as ChainEvents rows
  const storageHandler = new EventStorageHandler(models);

  // creates and updates ChainEntity rows corresponding with entity-related events
  const entityArchivalHandler = new EntityArchivalHandler(models, null, rmqController);

  const allChainEventHandlers = [
    storageHandler,
    entityArchivalHandler,
  ];

  // build the context the queue processor needs
  const ceProcessorContext: CeProcessorContextType = {
    allChainEventHandlers,
    log
  }
  // build the RabbitMQ subscription
  const ceProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainEvents,
    subscriptionName: RascalSubscriptions.ChainEvents,
    msgProcessorContext: ceProcessorContext
  }

  let subscriptions: RabbitMQSubscription[] = [ceProcessorRmqSub];

  const serviceConsumer = new ServiceConsumer("ChainEventsConsumer", rmqController, subscriptions);
  await serviceConsumer.init();

  log.info('Consumer started');
}

async function main() {
  try {
    log.info('Starting consumer...');
    await setupChainEventConsumers();
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

main();
