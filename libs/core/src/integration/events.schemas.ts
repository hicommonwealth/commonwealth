import {
  Comment,
  PG_INT,
  Reaction,
  SubscriptionPreference,
  Thread,
} from '@hicommonwealth/schemas';
import { z } from 'zod';
import {
  AaveV2ProposalCreated,
  AaveV2ProposalExecuted,
  AaveV2ProposalQueued,
  CommunityStakeTrade,
  GenericProposalCanceled,
  GovBravoProposalCreated,
  GovBravoProposalExecuted,
  GovBravoProposalQueued,
  NamespaceDeployed,
} from './chain-event.schemas';
import { EventMetadata } from './util.schemas';

export const ThreadCreated = Thread.omit({ search: true }).extend({
  contestManagers: z.array(z.object({ contest_address: z.string() })).nullish(),
});
export const ThreadUpvoted = Reaction.omit({ comment_id: true }).extend({
  thread_id: PG_INT,
  community_id: z.string(),
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
  communityId: z.string(),
  userId: z.string(),
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
        '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
      ),
    }),
    parsedArgs: GovBravoProposalCreated,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec',
      ),
    }),
    parsedArgs: AaveV2ProposalCreated,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe',
      ),
    }),
    parsedArgs: AaveV2ProposalQueued,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
      ),
    }),
    parsedArgs: GovBravoProposalQueued,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
      ),
    }),
    parsedArgs: GovBravoProposalExecuted,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x9c85b616f29fca57a17eafe71cf9ff82ffef41766e2cf01ea7f8f7878dd3ec24',
      ),
    }),
    parsedArgs: AaveV2ProposalExecuted,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
      ),
    }),
    parsedArgs: GenericProposalCanceled,
  }),
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
    .number()
    .int()
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
