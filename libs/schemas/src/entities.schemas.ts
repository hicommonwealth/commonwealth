import {
  BalanceSourceType,
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  CosmosGovernanceVersion,
  DefaultPage,
  NodeHealth,
  NotificationCategories,
  commonProtocol,
} from '@hicommonwealth/shared';
import z from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from './constants';
import { Contest } from './projections';
import { PG_INT, discordMetaSchema, linksSchema } from './utils.schemas';

export const User = z.object({
  id: PG_INT.optional(),
  email: z.string().max(255).email().nullish(),
  isAdmin: z.boolean().default(false).optional(),
  disableRichText: z.boolean().default(false).optional(),
  emailVerified: z.boolean().default(false).optional(),
  selected_community_id: z.string().max(255).optional().nullish(),
  emailNotificationInterval: z
    .enum(['weekly', 'never'])
    .default('never')
    .optional(),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
});

export const Profile = z.object({
  id: PG_INT,
  user_id: PG_INT,
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  profile_name: z.string().max(255).optional(),
  email: z.string().max(255).optional(),
  website: z.string().max(255).optional(),
  bio: z.string().optional(),
  avatar_url: z.string().max(255).optional(),
  slug: z.string().max(255).optional(),
  socials: z.array(z.string()).optional(),
  background_image: z.any().optional(),
  bio_backup: z.string().optional(),
  profile_name_backup: z.string().max(255).optional(),
});

export const Address = z.object({
  id: PG_INT.optional(),
  address: z.string().max(255),
  community_id: z.string().max(255).optional(),
  user_id: PG_INT.optional(),
  verification_token: z.string().max(255).optional(),
  verification_token_expires: z.date().nullable().optional(),
  verified: z.date().nullable().optional(),
  keytype: z.string().max(255).optional(),
  last_active: z.date().nullable().optional(),
  is_councillor: z.boolean().optional(),
  is_validator: z.boolean().optional(),
  ghost_address: z.boolean().optional(),
  profile_id: PG_INT.nullish().optional(),
  wallet_id: z.string().max(255).optional(),
  block_info: z.string().max(255).optional(),
  is_user_default: z.boolean().optional(),
  role: z.enum(['member', 'admin', 'moderator']).default('member'),
  wallet_sso_source: z.string().max(255).optional(),
  hex: z.string().max(64).optional(),
  created_at: z.any(),
  updated_at: z.any(),
});

export const CommunityMember = z.object({
  id: PG_INT,
  user_id: PG_INT,
  profile_name: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  addresses: z.array(
    z.object({
      id: PG_INT,
      community_id: z.string(),
      address: z.string(),
      stake_balance: z.string().optional(),
    }),
  ),
  roles: z.array(z.string()).optional(),
  group_ids: z.array(PG_INT),
  last_active: z.any().optional().nullable().describe('string or date'),
});

const ContractSource = z.object({
  source_type: z.enum([
    BalanceSourceType.ERC20,
    BalanceSourceType.ERC721,
    BalanceSourceType.ERC1155,
  ]),
  evm_chain_id: PG_INT,
  contract_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token_id: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
});

const NativeSource = z.object({
  source_type: z.enum([BalanceSourceType.ETHNative]),
  evm_chain_id: PG_INT,
});

const CosmosSource = z.object({
  source_type: z.enum([BalanceSourceType.CosmosNative]),
  cosmos_chain_id: z.string(),
  token_symbol: z.string(),
});

const CosmosContractSource = z.object({
  source_type: z.enum([BalanceSourceType.CW721, BalanceSourceType.CW20]),
  cosmos_chain_id: z.string(),
  contract_address: z.string(),
});

const ThresholdData = z.object({
  threshold: z.string().regex(/^[0-9]+$/),
  source: z.union([
    ContractSource,
    NativeSource,
    CosmosSource,
    CosmosContractSource,
  ]),
});

const AllowlistData = z.object({
  allow: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)),
});

export const Requirement = z.union([
  z.object({
    rule: z.enum(['threshold']),
    data: ThresholdData,
  }),
  z.object({
    rule: z.enum(['allow']),
    data: AllowlistData,
  }),
]);

export const GroupMetadata = z.object({
  name: z.string(),
  description: z.string(),
  required_requirements: PG_INT.optional(),
  membership_ttl: z.number().optional(), // NOT USED
});

export const Group = z.object({
  id: PG_INT,
  community_id: z.string(),
  metadata: GroupMetadata,
  requirements: z.array(Requirement),
  is_system_managed: z.boolean().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const Thread = z.object({
  Address: Address.optional(),
  address_id: PG_INT,
  title: z.string(),
  kind: z.string(),
  stage: z.string(),
  id: PG_INT.optional(),
  body: z.string().optional(),
  plaintext: z.string().optional(),
  url: z.string().optional(),
  topic_id: PG_INT.optional(),
  pinned: z.boolean().optional(),
  community_id: z.string(),
  view_count: PG_INT,
  links: z.object(linksSchema).array().optional(),

  read_only: z.boolean().optional(),
  version_history: z.array(z.string()).optional(),

  has_poll: z.boolean().optional(),

  canvas_action: z.string(),
  canvas_session: z.string(),
  canvas_hash: z.string(),

  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  last_edited: z.date().optional(),
  deleted_at: z.date().optional(),
  last_commented_on: z.date().optional(),
  marked_as_spam_at: z.date().optional(),
  archived_at: z.date().optional(),
  locked_at: z.date().optional(),
  discord_meta: z.object(discordMetaSchema).optional(),

  //counts
  reaction_count: PG_INT,
  reaction_weights_sum: PG_INT,
  comment_count: PG_INT,

  //notifications
  max_notif_id: PG_INT,

  profile_name: z.string(),
});

export const Comment = z.object({
  thread_id: PG_INT,
  address_id: PG_INT,
  text: z.string(),
  plaintext: z.string(),
  id: PG_INT.optional(),
  community_id: z.string(),
  parent_id: z.string().optional(),
  version_history: z.array(z.string()).optional(),

  canvas_action: z.string(),
  canvas_session: z.string(),
  canvas_hash: z.string(),

  created_at: z.any(),
  updated_at: z.any(),
  deleted_at: z.any(),
  marked_as_spam_at: z.any(),

  discord_meta: z
    .object({
      user: z.object({
        id: z.string(),
        username: z.string(),
      }),
      channel_id: z.string(),
      message_id: z.string(),
    })
    .optional(),

  reaction_count: PG_INT,
  reaction_weights_sum: z
    .number()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional(),

  Address: Address.optional(),
});

export const StakeTransaction = z.object({
  transaction_hash: z.string().length(66),
  community_id: z.string(),
  stake_id: PG_INT.default(2),
  address: z.string(),
  stake_amount: PG_INT,
  stake_price: z.coerce.string(),
  stake_direction: z.enum(['buy', 'sell']),
  timestamp: PG_INT,
});

export const CommunityStake = z.object({
  id: PG_INT.optional(),
  community_id: z.string(),
  stake_id: PG_INT.default(1),
  stake_token: z.string().default(''),
  vote_weight: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .default(1),
  stake_enabled: z.boolean().default(false),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  StakeTransactions: z.array(StakeTransaction).optional(),
});

export const Topic = z.object({
  id: PG_INT.optional(),
  name: z.string().max(255).default('General'),
  community_id: z.string().max(255),
  description: z.string().default(''),
  telegram: z.string().max(255).optional().nullable(),
  featured_in_sidebar: z.boolean().default(false),
  featured_in_new_post: z.boolean().default(false),
  default_offchain_template: z.string().optional().nullable(),
  order: PG_INT.optional(),
  channel_id: z.string().max(255).optional().nullable(),
  group_ids: z.array(PG_INT).default([]),
  default_offchain_template_backup: z.string().optional().nullable(),
});

export const ContestManager = z
  .object({
    contest_address: z.string().describe('On-Chain contest manager address'),
    community_id: z.string(),
    name: z.string(),
    image_url: z.string().optional(),
    funding_token_address: z
      .string()
      .optional()
      .describe('Provided by admin on creation when stake funds are not used'),
    prize_percentage: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe('Percentage of pool used for prizes in recurring contests'),
    payout_structure: z
      .array(z.number().int().min(0).max(100))
      .describe('Sorted array of percentages for prize, from first to last'),
    interval: z
      .number()
      .int()
      .min(0)
      .max(100)
      .describe('Recurring contest interval, 0 when one-off'),
    ticker: z.string().optional().default(commonProtocol.Denominations.ETH),
    decimals: PG_INT.optional().default(
      commonProtocol.WeiDecimals[commonProtocol.Denominations.ETH],
    ),
    created_at: z.date(),
    cancelled: z
      .boolean()
      .optional()
      .describe('Flags when contest policy is cancelled by admin'),
    topics: z.array(Topic).optional(),
    contests: z.array(Contest).optional(),
  })
  .describe('On-Chain Contest Manager');

export const ContestTopic = z
  .object({
    contest_address: z.string(),
    topic_id: PG_INT,
    created_at: z.date(),
  })
  .describe('X-Ref to topics in contest');

export const Community = z.object({
  name: z.string(),
  chain_node_id: PG_INT,
  default_symbol: z.string().default(''),
  network: z.nativeEnum(ChainNetwork).default(ChainNetwork.Ethereum),
  base: z.nativeEnum(ChainBase),
  icon_url: z.string(),
  active: z.boolean(),
  type: z.nativeEnum(ChainType).default(ChainType.Chain),
  id: z.string().optional(),
  description: z.string().optional(),
  social_links: z.array(z.string()).optional(),
  ss58_prefix: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional(),
  stages_enabled: z.boolean().optional(),
  custom_stages: z.array(z.string()).optional(),
  custom_domain: z.string().optional(),
  block_explorer_ids: z.string().optional(),
  collapsed_on_homepage: z.boolean().optional(),
  substrate_spec: z.string().optional(),
  has_chain_events_listener: z.boolean().optional(),
  default_summary_view: z.boolean().optional(),
  default_page: z.nativeEnum(DefaultPage).optional(),
  has_homepage: z.enum(['true', 'false']).optional().default('false').nullish(),
  terms: z.string().optional(),
  admin_only_polling: z.boolean().optional(),
  bech32_prefix: z.string().optional(),
  hide_projects: z.boolean().optional(),
  token_name: z.string().optional(),
  ce_verbose: z.boolean().optional(),
  discord_config_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional()
    .nullish(),
  category: z.unknown().optional(), // Assuming category can be any type
  discord_bot_webhooks_enabled: z.boolean().optional(),
  directory_page_enabled: z.boolean().optional(),
  directory_page_chain_node_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional(),
  namespace: z.string().optional(),
  namespace_address: z.string().optional(),
  redirect: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  Addresses: z.array(Address).optional(),
  CommunityStakes: z.array(CommunityStake).optional(),
  topics: z.array(Topic).optional(),
  groups: z.array(Group).optional(),
  contest_managers: z.array(ContestManager).optional(),
  snapshot_spaces: z.array(z.string().max(255)).default([]).optional(),
});

export const CommunityContract = z.object({
  id: PG_INT,
  community_id: z.string().max(255),
  contract_id: PG_INT,
  created_at: z.date(),
  updated_at: z.date(),
});

export const Contract = z.object({
  id: PG_INT,
  address: z.string().max(255),
  chain_node_id: PG_INT,
  abi_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional()
    .nullable(),
  decimals: PG_INT.optional(),
  token_name: z.string().max(255).optional(),
  symbol: z.string().max(255).optional(),
  type: z.string().max(255),
  created_at: z.date(),
  updated_at: z.date(),
  is_factory: z.boolean().default(false),
  nickname: z.string().max(255).optional(),
});

export const NotificationCategory = z.object({
  name: z.string().max(255),
  description: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const SnapshotSpace = z.object({
  snapshot_space: z.string().max(255),
  created_at: z.date(),
  updated_at: z.date(),
});

export const SnapshotProposal = z.object({
  id: z.string().max(255),
  title: z.string().max(255).optional(),
  body: z.string(),
  choices: z.array(z.string().max(255)),
  space: z.string().max(255),
  event: z.string().max(255).optional(),
  start: z.string().max(255).optional(),
  expire: z.string().max(255).optional(),
  is_upstream_deleted: z.boolean().default(false),
});

export const Subscription = z.object({
  id: PG_INT,
  subscriber_id: PG_INT,
  category_id: z.nativeEnum(NotificationCategories),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date(),
  immediate_email: z.boolean().default(false),
  community_id: z.string().max(255).optional().nullable(),
  thread_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional()
    .nullable(),
  comment_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional()
    .nullable(),
  snapshot_id: z.string().max(255).optional().nullable(),
});

export const ChainNode = z.object({
  id: PG_INT.optional(),
  url: z.string().max(255),
  eth_chain_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional(),
  alt_wallet_url: z.string().max(255).optional(),
  private_url: z.string().max(255).optional(),
  balance_type: z.nativeEnum(BalanceType),
  name: z.string().max(255),
  description: z.string().max(255).optional(),
  ss58: PG_INT.optional(),
  bech32: z.string().max(255).optional(),
  slip44: PG_INT.optional(),
  created_at: z.any(),
  updated_at: z.any(),
  cosmos_chain_id: z
    .string()
    .regex(/[a-z0-9]+/)
    .optional(),
  cosmos_gov_version: z.nativeEnum(CosmosGovernanceVersion).optional(),
  health: z.nativeEnum(NodeHealth).default(NodeHealth.Healthy).optional(),
  contracts: z.array(Contract).optional(),
  block_explorer: z.string().optional(),
});

// aliases
export const Chain = Community;

export const SubscriptionPreference = z.object({
  id: PG_INT,
  user_id: PG_INT,
  email_notifications_enabled: z.boolean().default(false),
  digest_email_enabled: z.boolean().default(false),
  recap_email_enabled: z.boolean().default(false),
  mobile_push_notifications_enabled: z.boolean().default(false),
  mobile_push_discussion_activity_enabled: z.boolean().default(false),
  mobile_push_admin_alerts_enabled: z.boolean().default(false),
  created_at: z.date().default(new Date()),
  updated_at: z.date().default(new Date()),
});

export const ThreadSubscription = z.object({
  id: PG_INT.optional(),
  user_id: PG_INT,
  thread_id: PG_INT,
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CommentSubscription = z.object({
  id: PG_INT.optional(),
  user_id: PG_INT,
  comment_id: PG_INT,
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CommunityAlert = z.object({
  id: PG_INT.optional(),
  user_id: PG_INT,
  community_id: z.string(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});
