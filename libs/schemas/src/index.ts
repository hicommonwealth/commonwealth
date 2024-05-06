import * as entities from './entities';

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
  | 'Profile'
  | 'CommentSubscription'
  | 'ThreadSubscription'
>;

export * from './commands';
export * from './entities';
export * from './projections';
export * from './queries';
export * from './utils';
