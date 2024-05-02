import * as events from './events.schemas';
export type Events = keyof typeof events;
export { events };

import * as entitySchemas from './entities.schemas';
import { Outbox } from './outbox.schema';

const entities = {
  ...entitySchemas,
  Outbox,
};
export type Entities = keyof typeof entities;
export type Aggregates = Extract<
  Entities,
  | 'ChainNode'
  | 'Comment'
  | 'Community'
  | 'NotificationCategory'
  | 'Subscription'
  | 'Thread'
  | 'User'
  | 'StakeTransaction'
  | 'SubscriptionPreference'
  | 'CommunityAlert'
  | 'Address'
  | 'Topic'
>;
export { entities };

export * as commands from './commands';
export * as projections from './projections';
export * as queries from './queries';
export * from './utils.schemas';
