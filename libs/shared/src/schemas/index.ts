import * as entities from './entities.schemas';

export * as commands from './commands';
export * as entities from './entities.schemas';
export * as projections from './projections';
export * as queries from './queries';
export * from './utils.schemas';

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
