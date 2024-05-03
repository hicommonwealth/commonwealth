import * as commands from './schemas/commands';
import * as entities from './schemas/entities.schemas';
import * as projections from './schemas/projections';
import * as queries from './schemas/queries';
export * from './schemas/utils.schemas';

export { commands, entities, projections, queries };

export * as commonProtocol from './commonProtocol';
export * from './constants';
export * from './types';
export * from './utils';

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
