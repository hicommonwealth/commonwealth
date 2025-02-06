import { z } from 'zod';
import * as chainEvents from './chain-event.schemas';
import * as events from './events.schemas';

// TODO: All usages of this should be replaced by the EventNames enum - exporting all by default causes issues
//  when non-event schemas are added to the schema i.e. this is an implicit export and EventNames makes it explicit
export type Events = keyof typeof events;
export { chainEvents, events };

export enum EventNames {
  ChainEventCreated = 'ChainEventCreated',
  UserCreated = 'UserCreated',
  AddressOwnershipTransferred = 'AddressOwnershipTransferred',
  CommentCreated = 'CommentCreated',
  CommentUpvoted = 'CommentUpvoted',
  CommunityCreated = 'CommunityCreated',
  CommunityJoined = 'CommunityJoined',
  DiscordMessageCreated = 'DiscordMessageCreated',
  GroupCreated = 'GroupCreated',
  SnapshotProposalCreated = 'SnapshotProposalCreated',
  ThreadCreated = 'ThreadCreated',
  ThreadUpvoted = 'ThreadUpvoted',
  UserMentioned = 'UserMentioned',

  DiscordThreadCreated = 'DiscordThreadCreated',
  DiscordThreadBodyUpdated = 'DiscordThreadBodyUpdated',
  DiscordThreadTitleUpdated = 'DiscordThreadTitleUpdated',
  DiscordThreadDeleted = 'DiscordThreadDeleted',
  DiscordThreadCommentCreated = 'DiscordThreadCommentCreated',
  DiscordThreadCommentUpdated = 'DiscordThreadCommentUpdated',
  DiscordThreadCommentDeleted = 'DiscordThreadCommentDeleted',

  // Contests
  RecurringContestManagerDeployed = 'RecurringContestManagerDeployed',
  OneOffContestManagerDeployed = 'OneOffContestManagerDeployed',
  ContestStarted = 'ContestStarted',
  ContestContentAdded = 'ContestContentAdded',
  ContestContentUpvoted = 'ContestContentUpvoted',
  FarcasterCastCreated = 'FarcasterCastCreated',
  FarcasterReplyCastCreated = 'FarcasterReplyCastCreated',
  FarcasterContestBotMentioned = 'FarcasterContestBotMentioned',
  FarcasterVoteCreated = 'FarcasterVoteCreated',
  ContestRolloverTimerTicked = 'ContestRolloverTimerTicked',

  // Preferences
  SubscriptionPreferencesUpdated = 'SubscriptionPreferencesUpdated',

  // Referrals
  SignUpFlowCompleted = 'SignUpFlowCompleted',

  // Twitter Bots
  TwitterMomBotMentioned = 'TwitterMomBotMentioned',
  TwitterContestBotMentioned = 'TwitterContestBotMentioned',
}

export type EventPairs =
  | {
      event_name: EventNames.UserCreated;
      event_payload: z.infer<typeof events.UserCreated>;
    }
  | {
      event_name: EventNames.AddressOwnershipTransferred;
      event_payload: z.infer<typeof events.AddressOwnershipTransferred>;
    }
  | {
      event_name: EventNames.CommunityCreated;
      event_payload: z.infer<typeof events.CommunityCreated>;
    }
  | {
      event_name: EventNames.CommunityJoined;
      event_payload: z.infer<typeof events.CommunityJoined>;
    }
  | {
      event_name: EventNames.CommentCreated;
      event_payload: z.infer<typeof events.CommentCreated>;
    }
  | {
      event_name: EventNames.ThreadCreated;
      event_payload: z.infer<typeof events.ThreadCreated>;
    }
  | {
      event_name: EventNames.ThreadUpvoted;
      event_payload: z.infer<typeof events.ThreadUpvoted>;
    }
  | {
      event_name: EventNames.ChainEventCreated;
      event_payload: z.infer<typeof events.ChainEventCreated>;
    }
  | {
      event_name: EventNames.SnapshotProposalCreated;
      event_payload: z.infer<typeof events.SnapshotProposalCreated>;
    }
  | {
      event_name: EventNames.UserMentioned;
      event_payload: z.infer<typeof events.UserMentioned>;
    }
  | {
      event_name: EventNames.RecurringContestManagerDeployed;
      event_payload: z.infer<typeof events.RecurringContestManagerDeployed>;
    }
  | {
      event_name: EventNames.OneOffContestManagerDeployed;
      event_payload: z.infer<typeof events.OneOffContestManagerDeployed>;
    }
  | {
      event_name: EventNames.ContestStarted;
      event_payload: z.infer<typeof events.ContestStarted>;
    }
  | {
      event_name: EventNames.ContestContentAdded;
      event_payload: z.infer<typeof events.ContestContentAdded>;
    }
  | {
      event_name: EventNames.ContestContentUpvoted;
      event_payload: z.infer<typeof events.ContestContentUpvoted>;
    }
  | {
      event_name: EventNames.SubscriptionPreferencesUpdated;
      event_payload: z.infer<typeof events.SubscriptionPreferencesUpdated>;
    }
  | {
      event_name: EventNames.CommentUpvoted;
      event_payload: z.infer<typeof events.CommentUpvoted>;
    }
  | {
      event_name: EventNames.CommentUpvoted;
      event_payload: z.infer<typeof events.CommentUpvoted>;
    }
  | {
      event_name: EventNames.FarcasterCastCreated;
      event_payload: z.infer<typeof events.FarcasterCastCreated>;
    }
  | {
      event_name: EventNames.FarcasterReplyCastCreated;
      event_payload: z.infer<typeof events.FarcasterReplyCastCreated>;
    }
  | {
      event_name: EventNames.FarcasterContestBotMentioned;
      event_payload: z.infer<typeof events.FarcasterContestBotMentioned>;
    }
  | {
      event_name: EventNames.FarcasterVoteCreated;
      event_payload: z.infer<typeof events.FarcasterVoteCreated>;
    }
  | {
      event_name: EventNames.DiscordThreadCreated;
      event_payload: z.infer<typeof events.DiscordThreadCreated>;
    }
  | {
      event_name: EventNames.DiscordThreadTitleUpdated;
      event_payload: z.infer<typeof events.DiscordThreadTitleUpdated>;
    }
  | {
      event_name: EventNames.DiscordThreadBodyUpdated;
      event_payload: z.infer<typeof events.DiscordThreadBodyUpdated>;
    }
  | {
      event_name: EventNames.DiscordThreadCommentCreated;
      event_payload: z.infer<typeof events.DiscordThreadCommentCreated>;
    }
  | {
      event_name: EventNames.DiscordThreadCommentUpdated;
      event_payload: z.infer<typeof events.DiscordThreadCommentUpdated>;
    }
  | {
      event_name: EventNames.DiscordThreadCommentDeleted;
      event_payload: z.infer<typeof events.DiscordThreadCommentDeleted>;
    }
  | {
      event_name: EventNames.DiscordThreadDeleted;
      event_payload: z.infer<typeof events.DiscordThreadDeleted>;
    }
  | {
      event_name: EventNames.SignUpFlowCompleted;
      event_payload: z.infer<typeof events.SignUpFlowCompleted>;
    }
  | {
      event_name: EventNames.TwitterMomBotMentioned;
      event_payload: z.infer<typeof events.TwitterMomBotMentioned>;
    }
  | {
      event_name: EventNames.TwitterContestBotMentioned;
      event_payload: z.infer<typeof events.TwitterContestBotMentioned>;
    };
