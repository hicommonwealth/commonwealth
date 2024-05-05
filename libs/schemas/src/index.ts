import * as entities from './entities.schemas';

export { entities };
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

export * from './commands';
export * from './entities.schemas';
export * from './projections';
export * from './queries';
export * from './utils.schemas';
