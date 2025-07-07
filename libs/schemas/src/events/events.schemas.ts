import {
  CommunityGoalTypes,
  Roles,
  WalletId,
  WalletSsoSource,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { NamespaceReferral } from '../commands/community.schemas';
import { FarcasterCast } from '../commands/contest.schemas';
import { Comment } from '../entities/comment.schemas';
import { FarcasterAction } from '../entities/farcaster.schemas';
import { LaunchpadToken } from '../entities/launchpad-token.schemas';
import { SubscriptionPreference } from '../entities/notification.schemas';
import { Reaction } from '../entities/reaction.schemas';
import { Thread } from '../entities/thread.schemas';
import { DiscordEventBase, Tweet } from '../integrations';
import { EVM_ADDRESS_STRICT, EVM_BYTES, PG_INT } from '../utils';

// All events should carry this common metadata
export const EventMetadata = z.object({
  created_at: z.coerce.date().optional().describe('When the event was emitted'),
  // TODO: TBD
  // aggregateType: z.enum(Aggregates).describe("Event emitter aggregate type")
  // aggregateId: z.string().describe("Event emitter aggregate id")
  // correlation: z.string().describe("Event correlation key")
  // causation: z.object({}).describe("Event causation")
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
    community_id: z.string(),
    group_id: z.number(),
    creator_user_id: z.number(),
    created_at: z.coerce.date(),
  }),

  RoleUpdated: z.object({
    community_id: z.string(),
    address: z.string(),
    role: z.enum(Roles),
    created_at: z.coerce.date(),
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
    social_links: z.array(z.string()).optional(),
    created_at: z.coerce.date(),
  }),

  CommunityUpdated: z.object({
    community_id: z.string(),
    user_id: z.number(),
    social_links: z.array(z.string().nullish()).optional(),
    created_at: z.coerce.date(),
  }),

  CommunityJoined: z.object({
    community_id: z.string(),
    user_id: z.number(),
    oauth_provider: z.string().nullish(),
    referrer_address: z.string().nullish(),
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

  DiscordServerJoined: z.object({
    server_id: z.string(),
    user_id: z.number().nullish(),
    discord_username: z.string(),
    joined_date: z.coerce.date(),
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
    transaction_hash: z.string().describe('Transaction hash'),
    eth_chain_id: z.number().int().positive().describe('Ethereum chain id'),
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
    transaction_hash: z.string().describe('Transaction hash'),
    eth_chain_id: z.number().int().positive().describe('Ethereum chain id'),
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
    'When a farcaster contest frame cast has been posted',
  ),

  FarcasterCastDeleted: FarcasterCast.describe(
    'When a farcaster contest frame cast has been deleted',
  ),

  FarcasterReplyCastCreated: FarcasterCast.extend({
    verified_address: z.string(),
  }).describe('When cast is created as a reply to a contest frame'),

  FarcasterReplyCastDeleted: FarcasterCast.extend({
    verified_address: z.string(),
  }).describe('When cast is deleted on a contest frame cast'),

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
    referred_by_address: z.string().nullish(),
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
  TwitterCommonMentioned: Tweet.describe(
    'Emitted when a Twitter/X user mentions @commondotxyz',
  ),

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
      supply: z.coerce.bigint(),
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

  LaunchpadTokenRecordCreated: z.object({
    name: z.string(),
    symbol: z.string(),
    created_at: z.coerce.date(),
    eth_chain_id: z.number(),
    creator_address: EVM_ADDRESS_STRICT,
    token_address: EVM_ADDRESS_STRICT,
    namespace: z.string(),
    curve_id: z.string(),
    total_supply: z.string(),
    launchpad_liquidity: z.string(),
    reserve_ration: z.string(),
    initial_purchase_eth_amount: z.string(),
  }),

  LaunchpadTokenGraduated: z.object({
    token: LaunchpadToken,
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

  CommunityNamespaceCreated: z.object({
    name: z.string(),
    token: z.string(),
    namespaceAddress: z.string(),
    governanceAddress: z.string(),
  }),

  WalletLinked: z.object({
    user_id: z.number(),
    new_user: z.boolean(),
    wallet_id: z.nativeEnum(WalletId),
    community_id: z.string(),
    balance: z.string(),
    created_at: z.coerce.date(),
  }),

  SSOLinked: z.object({
    user_id: z.number(),
    new_user: z.boolean(),
    oauth_provider: z.nativeEnum(WalletSsoSource),
    community_id: z.string(),
    created_at: z.coerce.date(),
  }),

  XpChainEventCreated: z.object({
    eth_chain_id: z.number(),
    quest_action_meta_ids: z.array(z.number()),
    transaction_hash: z.string(),
    created_at: z.coerce.date(),
  }),

  // TokenStaking - TODO: review mapping rules with @timolegros
  TokenLocked: ChainEventBase.extend({
    parsedArgs: z.object({
      address: EVM_ADDRESS_STRICT.describe('User address'),
      amount: z.coerce.bigint().describe('Locked amount'),
      tokenId: z.coerce.bigint().describe('Token id'),
      duration: z.coerce.bigint().describe('Duration (in seconds)'),
      isPermanent: z.boolean().describe('Is permanent'),
    }),
  }),
  TokenLockDurationIncreased: ChainEventBase.extend({
    parsedArgs: z.object({
      tokenId: z.coerce.bigint().describe('Token id'),
      newDuration: z.coerce.bigint().describe('New duration (in seconds)'),
    }),
  }),
  TokenUnlocked: ChainEventBase.extend({
    parsedArgs: z.object({
      address: EVM_ADDRESS_STRICT.describe('User address'),
      tokenId: z.coerce.bigint().describe('Token id'),
      amount: z.coerce.bigint().describe('Locked amount'),
    }),
  }),
  TokenPermanentConverted: ChainEventBase.extend({
    parsedArgs: z.object({
      address: EVM_ADDRESS_STRICT.describe('User address'),
      tokenId: z.coerce.bigint().describe('Token id'),
      amount: z.coerce.bigint().describe('Locked amount'),
      duration: z.coerce.bigint().describe('Duration (in seconds)'),
    }),
  }),
  TokenDelegated: ChainEventBase.extend({
    parsedArgs: z.object({
      fromuser: EVM_ADDRESS_STRICT.describe('From user address'),
      touser: EVM_ADDRESS_STRICT.describe('To user address'),
      tokenId: z.coerce.bigint().describe('Token id'),
    }),
  }),
  TokenUndelegated: ChainEventBase.extend({
    parsedArgs: z.object({
      tokenId: z.coerce.bigint().describe('Token id'),
    }),
  }),
  TokenMerged: ChainEventBase.extend({
    parsedArgs: z.object({
      address: EVM_ADDRESS_STRICT.describe('User address'),
      fromTokenId: z.coerce.bigint().describe('From token id'),
      toTokenId: z.coerce.bigint().describe('To token id'),
      newAmount: z.coerce.bigint().describe('New amount'),
      newEnd: z.coerce.bigint().describe('New duration (in seconds)'),
    }),
  }),

  JudgeNominated: ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string().describe('Community namespace'),
      judge: EVM_ADDRESS_STRICT.describe('Judge address'),
      judgeId: z.coerce.bigint().describe('Judge ID'),
      nominator: EVM_ADDRESS_STRICT.describe('Nominator address'),
      currentNominations: z.coerce
        .bigint()
        .describe('Current nomination count'),
    }),
  }).describe('Contest judge nominated'),

  NominatorNominated: ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string().describe('Community namespace'),
      nominator: EVM_ADDRESS_STRICT.describe('Nominator address'),
    }),
  }).describe('Nomination token (ID 3) minted'),

  NominatorSettled: ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string().describe('Community namespace'),
    }),
  }).describe('Nomination configured'),

  NamespaceLinked: z.object({
    namespace_address: z.string(),
    deployer_address: z.string(),
    community_id: z.string(),
    referral: NamespaceReferral.optional(),
    created_at: z.coerce.date(),
  }),

  CommunityGoalReached: z.object({
    community_goal_meta_id: PG_INT,
    goal_type: z.enum(CommunityGoalTypes),
    community_id: z.string(),
    created_at: z.coerce.date(),
  }),

  TweetEngagementCapReached: z.object({
    quest_id: z.number(),
    quest_ended: z.boolean(),
    like_cap_reached: z.boolean().optional(),
    retweet_cap_reached: z.boolean().optional(),
    reply_cap_reached: z.boolean().optional(),
  }),

  CommunityTagsUpdated: z.object({
    community_id: z.string(),
    tag_ids: z.array(z.number()),
    created_at: z.coerce.date(),
  }),

  MembershipsRefreshed: z.object({
    community_id: z.string(),
    membership: z
      .object({
        group_id: z.number(),
        address_id: z.number(),
        user_id: z.number(),
        created: z.boolean(),
        rejected: z.boolean().optional(),
      })
      .array(),
    created_at: z.coerce.date(),
  }),

  CommunityDirectoryTagsUpdated: z.object({
    community_id: z.string(),
    tag_names: z.array(z.string()),
    selected_community_ids: z.array(z.string()),
    created_at: z.coerce.date(),
  }),

  RefreshWeightedVotesRequested: z.object({
    topic_id: PG_INT,
    community_id: z.string(),
    actor_user_id: PG_INT,
  }),
} as const;
