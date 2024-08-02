import * as events from './events.schemas';

// TODO: All usages of this should be replaced by the EventNames enum - exporting all by default causes issues
//  when non-event schemas are added to the schema i.e. this is an implicit export and EventNames makes it explicit
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
