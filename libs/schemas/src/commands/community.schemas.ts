import {
  ALL_COMMUNITIES,
  COMMUNITY_NAME_ERROR,
  COMMUNITY_NAME_REGEX,
  ChainBase,
  ChainType,
  CommunityGoalTypes,
  GatedActionEnum,
  MAX_SCHEMA_INT,
  MIN_SCHEMA_INT,
  Roles,
  WalletId,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { AuthContext, TopicContext, VerifiedContext } from '../context';
import { MCPServer } from '../entities';
import { Community } from '../entities/community.schemas';
import { Group, Requirement } from '../entities/group.schemas';
import { PinnedToken } from '../entities/pinned-token.schemas';
import { StakeTransaction } from '../entities/stake.schemas';
import { Tags } from '../entities/tag.schemas';
import { Topic } from '../entities/topic.schemas';
import { Address } from '../entities/user.schemas';
import { PG_INT, checkIconSize } from '../utils';

export const CreateCommunity = {
  input: z.object({
    id: z.string(),
    name: z
      .string()
      .max(255)
      .regex(COMMUNITY_NAME_REGEX, {
        message: COMMUNITY_NAME_ERROR,
      })
      .refine((data) => !data.includes(ALL_COMMUNITIES), {
        message: `String must not contain '${ALL_COMMUNITIES}'`,
      }),
    chain_node_id: PG_INT,
    description: z.string().optional(),
    icon_url: z
      .string()
      .url()
      .superRefine(async (val, ctx) => await checkIconSize(val, ctx))
      .optional(),
    social_links: z.array(z.string().url()).default([]),
    tags: z.array(z.string()).default([]), // community tags are dynamic, tags should be validated in service method
    directory_page_enabled: z.boolean().default(false),
    type: z.nativeEnum(ChainType).default(ChainType.Offchain),
    base: z.nativeEnum(ChainBase),
    allow_tokenized_threads: z.boolean().optional(),
    thread_purchase_token: z.string().optional(),

    // hidden optional params
    token_name: z.string().optional(),

    // deprecated params to be removed
    default_symbol: z.string().max(9),
    website: z.string().url().optional(),
    github: z.string().url().startsWith('https://github.com/').optional(),
    telegram: z.string().url().startsWith('https://t.me/').optional(),
    element: z.string().url().startsWith('https://matrix.to/').optional(),
    discord: z.string().url().startsWith('https://discord.com/').optional(),
    turnstile_token: z.string().nullish(),
  }),
  output: z.object({
    community: Community,
    admin_address: z.string().optional(),
  }),
  context: VerifiedContext,
};

export const SetCommunityStake = {
  input: z.object({
    community_id: z.string(),
    stake_id: z.coerce.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
    stake_token: z.string().default(''),
    vote_weight: z.coerce
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .default(1),
    stake_enabled: z.coerce.boolean().default(true),
  }),
  output: Community,
  context: AuthContext,
};

export const CreateStakeTransaction = {
  input: z.object({
    community_id: z.string(),
    transaction_hash: z.string().length(66),
  }),
  output: StakeTransaction,
  context: AuthContext,
};

export const RefreshCustomDomain = {
  input: z.object({
    custom_domain: z.string(),
  }),
  output: z.object({
    hostname: z.string(),
    cname: z.string(),
    cert_status: z.string(),
    status: z.string(),
    reason: z.string().optional(),
  }),
};

export const UpdateCustomDomain = {
  input: z.object({
    community_id: z.string().min(1),
    custom_domain: z.string(),
  }),
  output: z.object({
    acm_status: z.null(),
    acm_status_reason: z.null(),
    app: z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
    cname: z.string(),
    created_at: z.string().datetime(),
    hostname: z.string(),
    id: z.string().uuid(),
    kind: z.string(),
    status: z.string(),
    updated_at: z.string().datetime(),
    sni_endpoint: z.null(),
  }),
  context: AuthContext,
};

const Snapshot = z.string().regex(/.+\.(eth|xyz|io)$/);

export const UpdateCommunity = {
  input: Community.omit({ id: true, network: true, custom_domain: true })
    .partial()
    .extend({
      community_id: z.string(),
      name: z
        .string()
        .max(255)
        .regex(COMMUNITY_NAME_REGEX, {
          message: COMMUNITY_NAME_ERROR,
        })
        .refine((data) => !data.includes(ALL_COMMUNITIES), {
          message: `String must not contain '${ALL_COMMUNITIES}'`,
        })
        .optional(),
      featuredTopics: z.array(z.string()).optional(),
      snapshot: Snapshot.or(z.array(Snapshot)).optional(),
      transactionHash: z.string().optional(),
      launchpad_weighted_voting: z.boolean().optional(),
    }),
  output: Community,
  context: AuthContext,
};

export const SetCommunityMCPServers = {
  input: z.object({
    community_id: z.string(),
    mcp_server_ids: z.array(z.number()),
  }),
  output: z.array(MCPServer),
  context: AuthContext,
};

export const GenerateStakeholderGroups = {
  input: z.object({
    id: z.string(),
  }),
  output: z
    .object({
      groups: z.array(Group),
      created: z.boolean(),
    })
    .partial(),
};

export const UpdateTopicsOrder = {
  input: z.object({
    community_id: z.string(),
    ordered_ids: z.array(PG_INT),
  }),
  output: z.array(Topic),
  context: AuthContext,
};

export const CreateTopic = {
  input: z
    .object({
      community_id: z.string(),
    })
    .merge(
      Topic.pick({
        name: true,
        description: true,
        featured_in_sidebar: true,
        featured_in_new_post: true,
        default_offchain_template: true,
        weighted_voting: true,
        token_address: true,
        token_symbol: true,
        token_decimals: true,
        vote_weight_multiplier: true,
        chain_node_id: true,
        allow_tokenized_threads: true,
      }),
    ),
  output: z.object({
    topic: Topic.partial(),
    user_id: z.number(),
  }),
  context: AuthContext,
};

export const UpdateTopic = {
  input: z
    .object({
      topic_id: z.number(),
      community_id: z.string(),
    })
    .merge(
      Topic.pick({
        name: true,
        description: true,
        telegram: true,
        featured_in_sidebar: true,
        featured_in_new_post: true,
        default_offchain_template: true,
        allow_tokenized_threads: true,
      }).partial(),
    ),
  output: z.object({
    topic: Topic.partial(),
    user_id: z.number(),
  }),
  context: TopicContext,
};

export const UpdateTopicChannel = {
  input: z.object({
    topic_id: z.number(),
    channel_id: z.string().optional(),
  }),
  output: Topic,
  context: TopicContext,
};

export const ToggleArchiveTopic = {
  input: z.object({
    community_id: z.string(),
    topic_id: PG_INT,
    archive: z.boolean(),
  }),
  output: z.object({
    community_id: z.string(),
    topic_id: PG_INT,
  }),
  context: TopicContext,
};

const GroupMetadata = z.object({
  name: z.string(),
  description: z.string(),
  groupImageUrl: z.string().nullish(),
  required_requirements: PG_INT.nullish(),
  membership_ttl: PG_INT.optional(),
});

export const CreateGroup = {
  input: z.object({
    community_id: z.string(),
    metadata: GroupMetadata,
    requirements: z.array(Requirement).optional(),
    topics: z
      .array(
        z.object({
          id: PG_INT,
          is_private: z.boolean().optional(),
          permissions: z.array(z.nativeEnum(GatedActionEnum)),
        }),
      )
      .optional(),
  }),
  output: Community.extend({ groups: z.array(Group).optional() }).partial(),
  context: AuthContext,
};

export const NamespaceReferral = z.object({
  referrer_address: z.string(),
  referee_address: z.string(),
  timestamp: z.bigint(),
  eth_chain_id: z.number(),
  transaction_hash: z.string(),
});

export const LinkNamespace = {
  input: z.object({
    namespace_address: z.string(),
    deployer_address: z.string(),
    log_removed: z.boolean(),
    referral: NamespaceReferral.optional(),
  }),
  output: z.boolean(),
};

export const UpdateGroup = {
  input: z.object({
    community_id: z.string(),
    group_id: PG_INT,
    metadata: GroupMetadata.optional(),
    requirements: z.array(Requirement).optional(),
    topics: z
      .array(
        z.object({
          id: PG_INT,
          is_private: z.boolean().optional(),
          permissions: z.array(z.nativeEnum(GatedActionEnum)),
        }),
      )
      .optional(),
  }),
  output: Group.partial(),
  context: AuthContext,
};

export const DeleteGroup = {
  input: z.object({
    community_id: z.string(),
    group_id: PG_INT,
  }),
  output: z.object({
    community_id: z.string(),
    group_id: PG_INT,
  }),
  context: AuthContext,
};

export const DeleteAddress = {
  input: z.object({
    community_id: z.string(),
    address: z.string(),
  }),
  output: z.object({
    community_id: z.string(),
    address: z.string(),
  }),
  context: VerifiedContext,
};

export const DeleteAllAddresses = {
  input: z.object({
    community_id: z.string(),
    address: z.string(),
  }),
  output: z.object({
    community_id: z.string(),
    address: z.string(),
    deleted: z.number(),
  }),
  context: AuthContext,
};

export const UpdateRole = {
  input: z.object({
    community_id: z.string(),
    address: z.string(),
    role: z.enum(Roles),
  }),
  output: Address.partial(),
  context: AuthContext,
};

export const DeleteCommunity = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({
    community_id: z.string(),
  }),
  context: AuthContext,
};

export const RefreshCommunityMemberships = {
  input: z.object({
    community_id: z.string(),
    address: z.string().optional(),
    group_id: PG_INT.optional(),
    refresh_all: z.boolean().optional(),
  }),
  output: z.object({
    community_id: z.string(),
    created: z.number(),
    updated: z.number(),
  }),
  context: AuthContext,
};

export const SelectCommunity = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({}),
  context: VerifiedContext,
};

export const JoinCommunity = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({
    community_id: z.string(),
    base: z.nativeEnum(ChainBase),
    address_id: z.number(),
    address: z.string(),
    wallet_id: z.nativeEnum(WalletId).optional(),
    ss58Prefix: z.number().optional(),
  }),
  context: VerifiedContext,
};

export const BanAddress = {
  input: z.object({
    community_id: z.string(),
    address: z.string(),
  }),
  output: z.object({}),
  context: AuthContext,
};

export const PinToken = {
  input: z.object({
    community_id: z.string(),
    contract_address: z.string(),
    chain_node_id: z.number(),
  }),
  output: PinnedToken,
  context: AuthContext,
};

export const UnpinToken = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({}),
  context: AuthContext,
};

export const SetReachedGoal = {
  input: z.object({
    community_id: z.string(),
    community_goal_meta_id: z.number(),
    goal_type: z.enum(CommunityGoalTypes),
  }),
  output: z.object({}),
};

export const UpdateCommunityTags = {
  input: z.object({
    community_id: z.string(),
    tag_ids: z.array(z.number()),
  }),
  output: z.object({
    community_id: z.string(),
    tags: z.array(Tags),
  }),
  context: AuthContext,
};

export const UpdateBanner = {
  input: z.object({
    community_id: z.string(),
    banner_text: z.string(),
  }),
  output: z.boolean(),
  context: AuthContext,
};

export const ToggleCommunityStar = {
  input: z.object({ community_id: z.string() }),
  output: z.boolean(),
  context: AuthContext,
};

export const SetAddressWallet = {
  input: z.object({
    community_id: z.string(),
    wallet_id: z.nativeEnum(WalletId),
  }),
  output: z.boolean(),
  context: AuthContext,
};

export const RefreshWeightedVotes = {
  input: z.object({
    topic_id: PG_INT,
    community_id: z.string(),
  }),
  output: z.object({
    topic_id: PG_INT,
    community_id: z.string(),
  }),
  context: TopicContext,
};
