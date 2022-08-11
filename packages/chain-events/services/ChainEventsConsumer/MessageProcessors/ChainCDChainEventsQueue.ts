import { RabbitMQSubscription } from 'common-common/src/ServiceConsumer';
import { RascalSubscriptions } from 'common-common/src/rabbitmq/types';

async function addChainAndChainNode() {}


export const subscription: RabbitMQSubscription = {
  messageProcessor: addChainAndChainNode,
  subscriptionName: RascalSubscriptions.ChainEvents
}
