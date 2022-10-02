import { RabbitMQController, getRabbitMQConfig } from 'common-common/src/rabbitmq';
import {
  RabbitMQSubscription,
  ServiceConsumer,
} from 'common-common/src/ServiceConsumer';
import { BrokerConfig } from 'rascal';
import { RABBITMQ_URI } from '../config';
import { factory, formatFilename } from 'common-common/src/logging';
import { RascalSubscriptions } from 'common-common/src/rabbitmq/types';
import { processChainEntityCUD } from './messageProcessors/chainEntityCUDQueue';
import models from '../database';
import { processChainEventNotificationsCUD } from './messageProcessors/chainEventNotificationsCUDQueue';
import {processChainEventTypeCUD} from "./messageProcessors/chainEventTypeCUDQueue";

const log = factory.getLogger(formatFilename(__filename));

async function setupMainConsumer() {
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
  const context = {
    models,
    log,
  };

  const chainEntityCUDProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainEntityCUD,
    subscriptionName: RascalSubscriptions.ChainEntityCUDMain,
    msgProcessorContext: context,
  };

  const ceNotifsCUDProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainEventNotificationsCUD,
    subscriptionName: RascalSubscriptions.ChainEventNotificationsCUDMain,
    msgProcessorContext: context,
  };

  const ceTypeCUDProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainEventTypeCUD,
    subscriptionName: RascalSubscriptions.ChainEventTypeCUDMain,
    msgProcessorContext: context,
  };

  let subscriptions: RabbitMQSubscription[] = [
    chainEntityCUDProcessorRmqSub,
    ceNotifsCUDProcessorRmqSub,
    ceTypeCUDProcessorRmqSub,
  ];

  const serviceConsumer = new ServiceConsumer(
    'MainConsumer',
    rmqController,
    subscriptions
  );
  await serviceConsumer.init();

  log.info(
    `Consumer started. Name: ${serviceConsumer.serviceName}, id: ${serviceConsumer.serviceId}`
  );
}

async function main() {
  try {
    log.info('Starting main consumer');
    await setupMainConsumer();
  } catch (error) {
    log.fatal('Consumer setup failed', error);
  }
}

main();
