import getRabbitMQConfig from 'common-common/src/rabbitmq/RabbitMQConfig';
import { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import {
  RabbitMQSubscription,
  ServiceConsumer,
} from 'common-common/src/ServiceConsumer';
import { BrokerConfig } from 'rascal';
import { RABBITMQ_URI } from 'chain-events/services/config';
import { factory, formatFilename } from 'common-common/src/logging';
import { RascalSubscriptions } from 'common-common/src/rabbitmq/types';
import {
  Ithis as ChainEntityCUDContextType,
  processChainEntityCUD,
} from './messageProcessors/chainEntityCUDQueue';
import models from '../database';

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

  let subscriptions: RabbitMQSubscription[] = [chainEntityCUDProcessorRmqSub];

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
