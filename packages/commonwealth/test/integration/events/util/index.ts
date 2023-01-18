import StorageHandler from 'chain-events/services/ChainEventsConsumer/ChainEventHandlers/storage';
import ceModels from 'chain-events/services/database/database';
import type { CWEvent } from 'chain-events/src';
import {
  getRabbitMQConfig,
  RabbitMQController,
} from 'common-common/src/rabbitmq';
import { NotificationCategories } from 'common-common/src/types';
import { RABBITMQ_URI } from '../../../../server/config';
import models from '../../../../server/database';

interface ISetupSubscriptionsFunction {
  (email: string, address: string, chain: string): Promise<number>;
}

const setupSubscriptions: ISetupSubscriptionsFunction = async (
  email: string,
  address: string,
  chain: string
) => {
  const user = await models['User'].create({
    email,
    emailVerified: true,
    isAdmin: false,
    lastVisited: '{}',
  });

  await models['Address'].create({
    user_id: user.id,
    address,
    chain,
    // selected: true,
    verification_token: 'PLACEHOLDER',
    verification_token_expires: null,
    verified: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  });

  await models['Subscription'].create({
    subscriber_id: user.id,
    category_id: NotificationCategories.ChainEvent,
    object_id: 'edgeware-democracy-started',
    is_active: true,
  });

  await models['Subscription'].create({
    subscriber_id: user.id,
    category_id: NotificationCategories.ChainEvent,
    object_id: 'edgeware-slash',
    is_active: true,
  });

  return user.id;
};

const setupDbEvent = async (event: CWEvent) => {
  const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));
  const storageHandler = new StorageHandler(ceModels, controller, 'edgeware');
  return storageHandler.handle(event);
};

export { setupSubscriptions, setupDbEvent };
