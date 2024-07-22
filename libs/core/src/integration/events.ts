import * as events from './events.schemas';
export type Events = keyof typeof events;
export { events };

export enum EventNames {
  ChainEventCreated = 'ChainEventCreated',
  CommentCreated = 'CommentCreated',
  CommunityCreated = 'CommunityCreated',
  DiscordMessageCreated = 'DiscordMessageCreated',
  GroupCreated = 'GroupCreated',
  SnapshotProposalCreated = 'SnapshotProposalCreated',
  ThreadCreated = 'ThreadCreated',
  ThreadUpvoted = 'ThreadUpvoted',
  UserMentioned = 'UserMentioned',

  // Contests
  RecurringContestManagerDeployed = 'RecurringContestManagerDeployed',
  OneOffContestManagerDeployed = 'OneOffContestManagerDeployed',
  ContestStarted = 'ContestStarted',
  ContestContentAdded = 'ContestContentAdded',
  ContestContentUpvoted = 'ContestContentUpvoted',

  // Preferences
  SubscriptionPreferencesUpdated = 'SubscriptionPreferencesUpdated',
}

export const EvmNamespaceFactoryEventSignatures = {
  NewContest:
    '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693',
  NewNamespace:
    '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
};

export const EvmRecurringContestEventSignatures = {
  ContestStarted:
    '0x32391ebd47fc736bb885d21a45d95c3da80aef6987aa90a5c6e747e9bc755bc9',
  ContentAdded:
    '0x2f0d66b98c7708890a982e2194479b066a117a6f9a8f418f7f14c6001965b78b',
  VoterVoted:
    '0x68d40dd5e34d499a209946f8e381c1258bdeff6dea4e96e9ab921da385c03667',
};

export const EvmSingleContestEventSignatures = {
  ContestStarted:
    '0x002817006cf5e3f9ac0de6817ca39830ac7e731a4949a59e4ac3c8bef988b20c',
  ContentAdded:
    '0x2f0d66b98c7708890a982e2194479b066a117a6f9a8f418f7f14c6001965b78b',
  VoterVoted:
    '0xba2ce2b4fab99c4186fd3e0a8e93ffb61e332d0c4709bd01d01e7ac60631437a',
};

export const EvmCommunityStakingEventSignatures = {
  trade: '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
};
