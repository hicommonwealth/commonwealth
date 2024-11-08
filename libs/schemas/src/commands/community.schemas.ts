import {
  ALL_COMMUNITIES,
  COMMUNITY_NAME_ERROR,
  COMMUNITY_NAME_REGEX,
  ChainBase,
  ChainType,
  MAX_SCHEMA_INT,
  MIN_SCHEMA_INT,
  WalletId,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import {
  Community,
  Group,
  PermissionEnum,
  Requirement,
  StakeTransaction,
  Topic,
} from '../entities';
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

    // hidden optional params
    token_name: z.string().optional(),

    // deprecated params to be removed
    default_symbol: z.string().max(9),
    website: z.string().url().optional(),
    github: z.string().url().startsWith('https://github.com/').optional(),
    telegram: z.string().url().startsWith('https://t.me/').optional(),
    element: z.string().url().startsWith('https://matrix.to/').optional(),
    discord: z.string().url().startsWith('https://discord.com/').optional(),
  }),
  output: z.object({
    community: Community,
    admin_address: z.string().optional(),
  }),
};

export const SetCommunityStake = {
  input: z.object({
    id: z.string(),
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
};

export const CreateStakeTransaction = {
  input: z.object({
    id: z.string(), // should be id instead of community_id
    transaction_hash: z.string().length(66),
    community_id: z.string(),
  }),
  output: StakeTransaction,
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
};

const Snapshot = z.string().regex(/.+\.(eth|xyz)$/);

export const UpdateCommunity = {
  input: Community.omit({ network: true, custom_domain: true })
    .partial()
    .extend({
      id: z.string(),
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
    }),
  output: Community,
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
        vote_weight_multiplier: true,
      }),
    ),
  output: z.object({
    topic: Topic.partial(),
    user_id: z.number(),
  }),
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
        group_ids: true,
        telegram: true,
        featured_in_sidebar: true,
        featured_in_new_post: true,
        default_offchain_template: true,
      }).partial(),
    ),
  output: z.object({
    topic: Topic.partial(),
    user_id: z.number(),
  }),
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
};

const GroupMetadata = z.object({
  name: z.string(),
  description: z.string(),
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
          permissions: z.array(z.nativeEnum(PermissionEnum)),
        }),
      )
      .optional(),
  }),
  output: Community.extend({ groups: z.array(Group).optional() }).partial(),
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
          permissions: z.array(z.nativeEnum(PermissionEnum)),
        }),
      )
      .optional(),
  }),
  output: Group.partial(),
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
};

export const DeleteCommunity = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({
    community_id: z.string(),
  }),
};

export const RefreshCommunityMemberships = {
  input: z.object({
    community_id: z.string(),
    group_id: PG_INT.optional(),
  }),
  output: z.object({
    community_id: z.string(),
    created: z.number(),
    updated: z.number(),
  }),
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
};

export const BanAddress = {
  input: z.object({
    community_id: z.string(),
    address: z.string(),
  }),
  output: z.object({}),
};
