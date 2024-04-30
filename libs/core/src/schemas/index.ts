import * as events from './events.schemas';
export type Events = keyof typeof events;
export { events };

import * as entities from './entities.schemas';
export type Entities = keyof typeof entities;
export type Aggregates = Extract<
  Entities,
  | 'ChainNode'
  | 'Comment'
  | 'Community'
  | 'NotificationCategory'
  | 'SnapshotSpace'
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
