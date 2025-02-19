import { z } from 'zod';
import { FarcasterCast } from '../commands/contest.schemas';
import { Comment } from '../entities/comment.schemas';
import { FarcasterAction } from '../entities/farcaster.schemas';
import { SubscriptionPreference } from '../entities/notification.schemas';
import { Reaction } from '../entities/reaction.schemas';
import { Thread } from '../entities/thread.schemas';
import { Tweet } from '../integrations';
import { EVM_ADDRESS_STRICT, EVM_BYTES, PG_INT } from '../utils';
import { EventMetadata } from './util.schemas';

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

const ChainEventBase = z.object({
  eventSource: z.object({
    ethChainId: z.number(),
  }),
  rawLog: z.object({
    blockNumber: z.coerce.bigint(),
    blockHash: z.string(),
    transactionIndex: z.number(),
    removed: z.boolean(),
    address: z.string(),
    data: z.string(),
    topics: z.array(z.string()),
    transactionHash: z.string(),
    logIndex: z.number(),
  }),
  block: z.object({
    number: z.coerce.bigint(),
    hash: z.string(),
    logsBloom: z.string(),
    nonce: z.string().optional(),
    parentHash: z.string(),
    timestamp: z.coerce.bigint(),
    miner: z.string(),
    gasLimit: z.coerce.bigint(),
  }),
});

const ContestManagerEvent = EventMetadata.extend({
  contest_address: z.string().describe('Contest manager address'),
  contest_id: z
    .number()
    .int()
    .gte(0)
    .optional()
    .describe('Recurring contest id'),
});

export const events = {
  UserCreated: z.object({
    community_id: z.string(),
    address: z.string(),
    user_id: z.number(),
    created_at: z.coerce.date(),
    referrer_address: z.string().nullish(),
  }),

  AddressOwnershipTransferred: z.object({
    community_id: z.string(),
    address: z.string(),
    user_id: z.number(),
    old_user_id: z.number(),
    old_user_email: z.string().nullish(),
    created_at: z.coerce.date(),
  }),

  ThreadCreated: Thread.omit({
    search: true,
  }).extend({
    address: z.string().nullish(),
    contestManagers: z
      .array(z.object({ contest_address: z.string() }))
      .nullish(),
  }),

  ThreadUpvoted: Reaction.omit({
    comment_id: true,
  }).extend({
    address: z.string().nullish(),
    thread_id: PG_INT,
    community_id: z.string(),
    topic_id: z.number().optional(),
    contestManagers: z
      .array(z.object({ contest_address: z.string() }))
      .nullish(),
  }),

  CommentCreated: Comment.omit({ search: true }).extend({
    community_id: z.string(),
    users_mentioned: z
      .array(PG_INT)
      .optional()
      .describe('An array of user ids that are mentioned in the comment'),
  }),

  CommentUpvoted: Reaction.omit({ thread_id: true }).extend({
    comment_id: PG_INT,
  }),

  GroupCreated: z.object({
    groupId: z.string(),
    userId: z.string(),
  }),

  UserMentioned: z.object({
    authorAddressId: z.number(),
    authorUserId: z.number(),
    authorAddress: z.string(),
    mentionedUserId: z.number(),
    communityId: z.string(),
    thread: Thread.optional(),
    comment: Comment.optional(),
  }),

  CommunityCreated: z.object({
    community_id: z.string(),
    user_id: z.number(),
    referrer_address: z.string().optional(),
    created_at: z.coerce.date(),
  }),

  CommunityJoined: z.object({
    community_id: z.string(),
    user_id: z.number(),
    created_at: z.coerce.date(),
  }),

  SnapshotProposalCreated: z.object({
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
  }),

  DiscordMessageCreated: z.object({
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
  }),

  DiscordThreadCreated: DiscordEventBase,

  DiscordThreadBodyUpdated: DiscordEventBase,

  DiscordThreadTitleUpdated: DiscordEventBase.pick({
    user: true,
    title: true,
    message_id: true,
    parent_channel_id: true,
  }),

  DiscordThreadCommentCreated: DiscordEventBase.omit({
    title: true,
  }),

  DiscordThreadCommentUpdated: DiscordEventBase.omit({
    title: true,
  }),

  // TODO: Discord differentiates Thread body from the thread itself
  //  currently deleting a thread body is treated as deleting a comment
  //  which will lead to errors
  DiscordThreadCommentDeleted: DiscordEventBase.omit({
    title: true,
  }),

  DiscordThreadDeleted: DiscordEventBase.pick({
    message_id: true,
    parent_channel_id: true,
  }),

  // on-chain contest manager events
  RecurringContestManagerDeployed: EventMetadata.extend({
    namespace: z.string().describe('Community namespace'),
    contest_address: z.string().describe('Contest manager address'),
    interval: z
      .number()
      .int()
      .positive()
      .describe('Recurring constest interval'),
    block_number: z
      .number()
      .int()
      .positive()
      .describe('The block number in which the contest was created'),
  }).describe('When a new recurring contest manager gets deployed'),

  OneOffContestManagerDeployed: EventMetadata.extend({
    namespace: z.string().describe('Community namespace'),
    contest_address: z.string().describe('Contest manager address'),
    length: z.number().int().positive().describe('Length of contest in days'),
    block_number: z
      .number()
      .int()
      .positive()
      .describe('The block number in which the contest was created'),
  }).describe('When a new one-off contest manager gets deployed'),

  // Contest Events
  ContestStarted: ContestManagerEvent.extend({
    contest_id: z.number().int().gte(0),
    start_time: z.coerce.date().describe('Contest start time'),
    end_time: z.coerce.date().describe('Contest end time'),
    is_one_off: z.boolean().describe('Is this a one-off contest'),
  }).describe('When a contest instance gets started'),

  ContestRolloverTimerTicked: z
    .object({})
    .describe(
      'Polling event that triggers closing procedures and ending/end events',
    ),

  ContestEnding: ContestManagerEvent.extend({
    contest_id: z.number().int().gte(0),
    is_one_off: z.boolean().describe('Is this a one-off contest'),
  })
    .describe('When a contest instance is close to ending')
    .strict(),

  ContestEnded: ContestManagerEvent.extend({
    contest_id: z.number().int().gte(0),
    is_one_off: z.boolean().describe('Is this a one-off contest'),
    winners: z.array(
      z.object({
        address: z.string(),
        content: z.string(),
        votes: z.string(),
        prize: z.string(),
      }),
    ),
  }).describe('When a contest instance ended'),

  ContestContentAdded: ContestManagerEvent.extend({
    content_id: z.number().int().gte(0).describe('New content id'),
    creator_address: z.string().describe('Address of content creator'),
    content_url: z.string(),
  }).describe('When new content is added to a running contest'),

  ContestContentUpvoted: ContestManagerEvent.extend({
    content_id: z.number().int().gte(0).describe('Content id'),
    voter_address: z.string().describe('Address upvoting on content'),
    voting_power: z
      .string()
      .describe('Voting power of address upvoting on content'),
  }).describe('When users upvote content on running contest'),

  SubscriptionPreferencesUpdated: SubscriptionPreference.partial({
    email_notifications_enabled: true,
    digest_email_enabled: true,
    recap_email_enabled: true,
    mobile_push_notifications_enabled: true,
    mobile_push_discussion_activity_enabled: true,
    mobile_push_admin_alerts_enabled: true,
    created_at: true,
    updated_at: true,
  }).merge(SubscriptionPreference.pick({ user_id: true })),

  FarcasterCastCreated: FarcasterCast.describe(
    'When a farcaster contest cast has been posted',
  ),

  FarcasterReplyCastCreated: FarcasterCast.extend({
    verified_address: z.string(),
  }).describe('When a reply is posted to a farcaster contest cast'),

  FarcasterContestBotMentioned: FarcasterCast.extend({
    verified_address: z.string(),
  }).describe('When contest bot is mentioned on farcaster'),

  FarcasterVoteCreated: FarcasterAction.extend({
    contest_address: z.string(),
    verified_address: z.string(),
  }).describe('When a farcaster action is initiated on a cast reply'),

  SignUpFlowCompleted: z.object({
    user_id: z.number(),
    address: z.string(),
    created_at: z.coerce.date(),
  }),

  QuestStarted: z.object({
    id: PG_INT.nullish(),
    name: z.string().max(255),
    description: z.string().max(1000),
    image_url: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    community_id: z.string().nullish(),
  }),

  TwitterMomBotMentioned: Tweet,
  TwitterContestBotMentioned: Tweet,

  // Events mapped from ChainEvents
  CommunityStakeTrade: ChainEventBase.extend({
    parsedArgs: z.object({
      trader: EVM_ADDRESS_STRICT,
      namespace: EVM_ADDRESS_STRICT,
      isBuy: z.boolean(),
      communityTokenAmount: z.coerce.bigint(),
      ethAmount: z.coerce.bigint(),
      protocolEthAmount: z.coerce.bigint(),
      nameSpaceEthAmount: z.coerce.bigint(),
      supply: z.bigint(),
      exchangeToken: EVM_ADDRESS_STRICT,
    }),
  }),

  NamespaceDeployedWithReferral: ChainEventBase.extend({
    parsedArgs: z.object({
      name: z.string(),
      feeManager: EVM_ADDRESS_STRICT,
      referrer: EVM_ADDRESS_STRICT,
      referralFeeManager: EVM_ADDRESS_STRICT,
      signature: EVM_BYTES,
      namespaceDeployer: EVM_ADDRESS_STRICT,
      nameSpaceAddress: EVM_ADDRESS_STRICT,
    }),
  }),

  LaunchpadTokenCreated: z.object({
    block_timestamp: z.coerce.bigint(),
    transaction_hash: z.string(),
    eth_chain_id: z.number(),
  }),

  LaunchpadTokenTraded: z.object({
    block_timestamp: z.coerce.bigint(),
    transaction_hash: z.string(),
    trader_address: EVM_ADDRESS_STRICT,
    token_address: EVM_ADDRESS_STRICT,
    is_buy: z.boolean(),
    eth_chain_id: z.number(),
    eth_amount: z.coerce.bigint(),
    community_token_amount: z.coerce.bigint(),
    floating_supply: z.coerce.bigint(),
  }),

  ReferralFeeDistributed: ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: EVM_ADDRESS_STRICT,
      token: EVM_ADDRESS_STRICT,
      amount: z.coerce.bigint(),
      recipient: EVM_ADDRESS_STRICT,
      recipientAmount: z.coerce.bigint(),
    }),
  }),

  NamespaceDeployed: ChainEventBase.extend({
    parsedArgs: z.object({
      name: z.string(),
      _feeManager: EVM_ADDRESS_STRICT,
      _signature: EVM_BYTES,
      _namespaceDeployer: EVM_ADDRESS_STRICT,
      nameSpaceAddress: EVM_ADDRESS_STRICT,
    }),
  }),

  CustomXpChainEvent: z.object({
    eth_chain_id: z.number(),
    quest_action_meta_id: z.number(),
    transaction_hash: z.string(),
    created_at: z.coerce.date(),
  }),
} as const;
