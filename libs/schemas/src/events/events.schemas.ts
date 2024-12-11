import { z } from 'zod';
import { FarcasterAction, FarcasterCast } from '../commands/contest.schemas';
import { Comment } from '../entities/comment.schemas';
import { SubscriptionPreference } from '../entities/notification.schemas';
import { Reaction } from '../entities/reaction.schemas';
import { Thread } from '../entities/thread.schemas';
import { PG_INT } from '../utils';
import {
  CommunityStakeTrade,
  LaunchpadTokenCreated,
  LaunchpadTrade,
  NamespaceDeployed,
} from './chain-event.schemas';
import { EventMetadata } from './util.schemas';

export const ThreadCreated = Thread.omit({
  search: true,
}).extend({
  address: z.string().nullish(),
  contestManagers: z.array(z.object({ contest_address: z.string() })).nullish(),
});

export const ThreadUpvoted = Reaction.omit({
  comment_id: true,
}).extend({
  address: z.string().nullish(),
  thread_id: PG_INT,
  community_id: z.string(),
  topic_id: z.number().optional(),
  contestManagers: z.array(z.object({ contest_address: z.string() })).nullish(),
});

export const CommentCreated = Comment.omit({ search: true }).extend({
  community_id: z.string(),
  users_mentioned: z
    .array(PG_INT)
    .optional()
    .describe('An array of user ids that are mentioned in the comment'),
});

export const CommentUpvoted = Reaction.omit({ thread_id: true }).extend({
  comment_id: PG_INT,
});

export const GroupCreated = z.object({
  groupId: z.string(),
  userId: z.string(),
});

export const UserMentioned = z.object({
  authorAddressId: z.number(),
  authorUserId: z.number(),
  authorAddress: z.string(),
  mentionedUserId: z.number(),
  communityId: z.string(),
  thread: Thread.optional(),
  comment: Comment.optional(),
});

export const CommunityCreated = z.object({
  community_id: z.string(),
  user_id: z.number(),
  referral_link: z.string().optional(),
  created_at: z.coerce.date(),
});

export const CommunityJoined = z.object({
  community_id: z.string(),
  user_id: z.number(),
  referral_link: z.string().nullish(),
  created_at: z.coerce.date(),
});

export const SnapshotProposalCreated = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  choices: z.array(z.string()).optional(),
  space: z.string().optional(),
  event: z.string().optional(),
  start: z.number().optional(),
  expire: z.number().optional(),
  token: z.string().optional(),
  secret: z.string().optional(),
});

export const DiscordMessageCreated = z.object({
  user: z
    .object({
      id: z.string().nullish(),
      username: z.string().nullish(),
    })
    .optional(),
  title: z.string().optional(),
  content: z.string().nullish(),
  message_id: z.string(),
  channel_id: z.string().optional(),
  parent_channel_id: z.string().nullish(),
  guild_id: z.string().nullish(),
  imageUrls: z.array(z.string()).optional(),
  action: z.union([
    z.literal('thread-delete'),
    z.literal('thread-title-update'),
    z.literal('thread-body-update'),
    z.literal('thread-create'),
    z.literal('comment-delete'),
    z.literal('comment-update'),
    z.literal('comment-create'),
  ]),
});

const DiscordEventBase = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
  }),
  title: z.string(),
  content: z.string(),
  message_id: z.string(),
  channel_id: z.string(),
  parent_channel_id: z.string(),
  guild_id: z.string(),
  imageUrls: z.array(z.string()),
});

export const DiscordThreadCreated = DiscordEventBase;

export const DiscordThreadBodyUpdated = DiscordEventBase;

export const DiscordThreadTitleUpdated = DiscordEventBase.pick({
  user: true,
  title: true,
  message_id: true,
  parent_channel_id: true,
});

export const DiscordThreadCommentCreated = DiscordEventBase.omit({
  title: true,
});

export const DiscordThreadCommentUpdated = DiscordEventBase.omit({
  title: true,
});

// TODO: Discord differentiates Thread body from the thread itself
//  currently deleting a thread body is treated as deleting a comment
//  which will lead to errors
export const DiscordThreadCommentDeleted = DiscordEventBase.omit({
  title: true,
});

export const DiscordThreadDeleted = DiscordEventBase.pick({
  message_id: true,
  parent_channel_id: true,
});

const ChainEventCreatedBase = z.object({
  eventSource: z.object({
    kind: z.string(),
    chainNodeId: z.number(),
  }),
  rawLog: z.object({
    blockNumber: z.number(),
    blockHash: z.string(),
    transactionIndex: z.number(),
    removed: z.boolean(),
    address: z.string(),
    data: z.string(),
    topics: z.array(z.string()),
    transactionHash: z.string(),
    logIndex: z.number(),
  }),
});

/**
 * Zod schema for EvmEvent type defined in workers/evmChainEvents/types.ts
 */
export const ChainEventCreated = z.union([
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
      ),
    }),
    parsedArgs: NamespaceDeployed,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
      ),
    }),
    parsedArgs: CommunityStakeTrade,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0xd7ca5dc2f8c6bb37c3a4de2a81499b25f8ca8bbb3082010244fe747077d0f6cc',
      ),
    }),
    parsedArgs: LaunchpadTokenCreated,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x9adcf0ad0cda63c4d50f26a48925cf6405df27d422a39c456b5f03f661c82982',
      ),
    }),
    parsedArgs: LaunchpadTrade,
  }),
]);

// on-chain contest manager events
export const RecurringContestManagerDeployed = EventMetadata.extend({
  namespace: z.string().describe('Community namespace'),
  contest_address: z.string().describe('Contest manager address'),
  interval: z.number().int().positive().describe('Recurring constest interval'),
}).describe('When a new recurring contest manager gets deployed');

export const OneOffContestManagerDeployed = EventMetadata.extend({
  namespace: z.string().describe('Community namespace'),
  contest_address: z.string().describe('Contest manager address'),
  length: z.number().int().positive().describe('Length of contest in days'),
}).describe('When a new one-off contest manager gets deployed');

const ContestManagerEvent = EventMetadata.extend({
  contest_address: z.string().describe('Contest manager address'),
  contest_id: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe('Recurring contest id'),
});

export const ContestStarted = ContestManagerEvent.extend({
  start_time: z.coerce.date().describe('Contest start time'),
  end_time: z.coerce.date().describe('Contest end time'),
  contest_id: z.number().int().gte(1).describe('Recurring contest id'),
}).describe('When a contest instance gets started');

export const ContestContentAdded = ContestManagerEvent.extend({
  content_id: z.number().int().gte(0).describe('New content id'),
  creator_address: z.string().describe('Address of content creator'),
  content_url: z.string(),
}).describe('When new content is added to a running contest');

export const ContestContentUpvoted = ContestManagerEvent.extend({
  content_id: z.number().int().gte(0).describe('Content id'),
  voter_address: z.string().describe('Address upvoting on content'),
  voting_power: z
    .string()
    .describe('Voting power of address upvoting on content'),
}).describe('When users upvote content on running contest');

export const SubscriptionPreferencesUpdated = SubscriptionPreference.partial({
  email_notifications_enabled: true,
  digest_email_enabled: true,
  recap_email_enabled: true,
  mobile_push_notifications_enabled: true,
  mobile_push_discussion_activity_enabled: true,
  mobile_push_admin_alerts_enabled: true,
  created_at: true,
  updated_at: true,
}).merge(SubscriptionPreference.pick({ user_id: true }));

export const FarcasterCastCreated = FarcasterCast.describe(
  'When a farcaster contest cast has been posted',
);

export const FarcasterReplyCastCreated = FarcasterCast.describe(
  'When a reply is posted to a farcaster contest cast',
);

export const FarcasterVoteCreated = FarcasterAction.extend({
  contest_address: z.string(),
}).describe('When a farcaster action is initiated on a cast reply');

export const SignUpFlowCompleted = z.object({
  user_id: z.number(),
  created_at: z.coerce.date(),
  referral_link: z.string().nullish(),
});

export const ContestRolloverTimerTicked = z.object({});
