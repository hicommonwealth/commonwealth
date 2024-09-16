import {
  ALL_COMMUNITIES,
  COMMUNITY_NAME_ERROR,
  COMMUNITY_NAME_REGEX,
  ChainBase,
  ChainType,
  MAX_SCHEMA_INT,
  MIN_SCHEMA_INT,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { Community, Group, StakeTransaction } from '../entities';
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
    chain_node_id: PG_INT.optional(), // corresponds to the chain field
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
    user_address: z.string(), // why not use actor's address?

    // hidden optional params
    alt_wallet_url: z.string().url().optional(),
    eth_chain_id: PG_INT.optional(),
    cosmos_chain_id: z.string().optional(),
    address: z.string().optional(), // address for the contract of the chain
    decimals: PG_INT.optional(),
    bech32_prefix: z.string().optional(), // required for cosmos communities
    token_name: z.string().optional(),

    // deprecated params to be removed
    node_url: z.string().url(),
    network: z.string(),
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

export const DeleteTopic = {
  input: z.object({
    topic_id: PG_INT,
  }),
  output: z.object({
    community_id: z.string(),
    topic_id: PG_INT,
  }),
};
