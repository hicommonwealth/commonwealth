import { BrokerConfig } from "rascal";
import getRabbitMQConfig from "common-common/src/rabbitmq/RabbitMQConfig";
import { RabbitMQSubscription, ServiceConsumer } from "common-common/src/ServiceConsumer";
import EventStorageHandler from "./ChainEventHandlers/storage";
import EntityArchivalHandler from "./ChainEventHandlers/entityArchival";
import { factory, formatFilename } from "common-common/src/logging";
import { RabbitMQController } from "common-common/src/rabbitmq/rabbitMQController";
import { RascalSubscriptions } from "common-common/src/rabbitmq/types";
import models from "../app/database";
import { RABBITMQ_URI } from "../config";
import { Ithis as ChainEventsProcessorContextType, processChainEvents } from "./MessageProcessors/ChainEventsQueue";
import { processChainCUD, Ithis as chainCUDContextType } from "./MessageProcessors/ChainCUDChainEventsQueue";


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

  // setup Chain
  const chainEventsProcessorContext: ChainEventsProcessorContextType = {
    allChainEventHandlers,
    log
  }
  const chainEventsProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainEvents,
    subscriptionName: RascalSubscriptions.ChainEvents,
    msgProcessorContext: chainEventsProcessorContext
  }

  // setup ChainCUDChainEventsQueue message processor context + subscription
  const chainCUDContext: chainCUDContextType = {
    models,
    log
  }
  const chainCUDProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainCUD,
    subscriptionName: RascalSubscriptions.ChainCUDChainEvents,
    msgProcessorContext: chainCUDContext
  }

  let subscriptions: RabbitMQSubscription[] = [chainEventsProcessorRmqSub, chainCUDProcessorRmqSub];

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
