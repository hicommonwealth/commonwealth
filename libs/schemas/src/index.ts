import * as entities from './entities';

export type Entities = keyof typeof entities;
export type Aggregates = Extract<
  Entities,
  | 'ChainNode'
  | 'Comment'
  | 'CommentVersionHistory'
  | 'Community'
  | 'Thread'
  | 'ThreadVersionHistory'
  | 'Reaction'
  | 'User'
  | 'StakeTransaction'
  | 'SubscriptionPreference'
  | 'CommunityAlert'
  | 'Address'
  | 'Topic'
  | 'CommentSubscription'
  | 'ThreadSubscription'
  | 'Wallets'
  | 'GroupGatedAction'
  | 'Tags'
  | 'CommunityTags'
  | 'ContractAbi'
  | 'LaunchpadToken'
  | 'Group'
  | 'MCPServer'
  | 'MCPServerCommunity'
>;

export * from './commands';
export * from './context';
export * from './entities';
export * from './events';
export * from './integrations';
export * from './projections';
export * from './queries';
export * from './utils';
