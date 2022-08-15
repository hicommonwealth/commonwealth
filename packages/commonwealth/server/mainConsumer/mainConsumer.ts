import getRabbitMQConfig from 'common-common/src/rabbitmq/RabbitMQConfig';
import { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import {
  RabbitMQSubscription,
  ServiceConsumer,
} from 'common-common/src/ServiceConsumer';
import { BrokerConfig } from 'rascal';
import { RABBITMQ_URI } from '../config';
import { factory, formatFilename } from 'common-common/src/logging';
import { RascalSubscriptions } from 'common-common/src/rabbitmq/types';
import {
  Ithis as ChainEntityCUDContextType,
  processChainEntityCUD,
} from './messageProcessors/chainEntityCUDQueue';
import models from '../database';
import { processChainEventNotificationsCUD } from './messageProcessors/chainEventNotificationsCUDQueue';

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

  const chainEntityCUDContext: ChainEntityCUDContextType = {
    models,
    log,
  };
  const chainEntityCUDProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainEntityCUD,
    subscriptionName: RascalSubscriptions.ChainCUDChainEvents,
    msgProcessorContext: chainEntityCUDContext,
  };

  // the Ithis type for this context contains the publish function that
  // only becomes available when the rmqControllers context is added to the
  // functions' context within the rmqController itself. Thus, this context
  // is untyped
  const chainEventNotificationsCUDContext = {
    models,
    log,
  };
  const ceNotifsCUDProcessorRmqSub: RabbitMQSubscription = {
    messageProcessor: processChainEventNotificationsCUD,
    subscriptionName: RascalSubscriptions.ChainEventNotificationsCUDMain,
    msgProcessorContext: chainEventNotificationsCUDContext
  }

  let subscriptions: RabbitMQSubscription[] = [chainEntityCUDProcessorRmqSub, ceNotifsCUDProcessorRmqSub];

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
    log.info("Starting main consumer");
    await setupMainConsumer();
  } catch (error) {
    log.fatal("Consumer setup failed", error);
  }
}

main();
