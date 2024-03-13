import { z } from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../constants';
import {
  ChainBase,
  ChainNetwork,
  ChainType,
  CommunityCategoryType,
  DefaultPage,
} from '../types';
import { ALL_COMMUNITIES, checkIconSize } from '../utils';
import { Group } from './group.schemas';

export const CommunityStake = z.object({
  id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT).optional(),
  community_id: z.string().optional(),
  stake_id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT).optional(),
  stake_token: z.string().optional(),
  vote_weight: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional(),
  stake_enabled: z.boolean().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const Community = z.object({
  name: z.string(),
  chain_node_id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  default_symbol: z.string(),
  network: z.nativeEnum(ChainNetwork),
  base: z.nativeEnum(ChainBase),
  icon_url: z.string(),
  active: z.boolean(),
  type: z.nativeEnum(ChainType),
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
  has_homepage: z.boolean().optional(),
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
    .optional(),
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
  redirect: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const GetCommunityStake = {
  input: z.object({
    community_id: z.string(),
    stake_id: z.coerce
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .optional()
      .describe('The stake id or all stakes when undefined'),
  }),
  output: CommunityStake,
};

export const CreateCommunity = {
  input: z.object({
    id: z.string(),
    name: z
      .string()
      .max(255)
      .refine((data) => !data.includes(ALL_COMMUNITIES), {
        message: `String must not contain '${ALL_COMMUNITIES}'`,
      }),
    chain_node_id: z
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .optional(), // corresponds to the chain field
    description: z.string().optional(),
    icon_url: z
      .string()
      .url()
      .superRefine(async (val, ctx) => await checkIconSize(val, ctx))
      .optional(),
    social_links: z.array(z.string().url()).default([]),
    tags: z.array(z.nativeEnum(CommunityCategoryType)).default([]),
    directory_page_enabled: z.boolean().default(false),
    type: z.nativeEnum(ChainType).default(ChainType.Offchain),
    base: z.nativeEnum(ChainBase),

    // hidden optional params
    user_address: z.string().optional(), // address for the user
    alt_wallet_url: z.string().url().optional(),
    eth_chain_id: z.coerce
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .optional(),
    cosmos_chain_id: z.string().optional(),
    address: z.string().optional(), // address for the contract of the chain
    decimals: z
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .optional(),
    substrate_spec: z.string().optional(),
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
  output: Community,
};

export const SetCommunityStake = {
  input: z.object({
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
  output: Community.extend({
    CommunityStakes: z.array(CommunityStake).optional(),
  }),
};

export const UpdateCommunity = {
  input: z.object({
    namespace: z.string(),
    txHash: z.string(),
    address: z.string(),
  }),
  output: Community,
};

export const CommunityContract = z.object({
  id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  community_id: z.string().max(255),
  contract_id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  created_at: z.date(),
  updated_at: z.date(),
});

export const Contract = z.object({
  id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  address: z.string().max(255),
  chain_node_id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  abi_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional()
    .nullable(),
  decimals: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT).optional(),
  token_name: z.string().max(255).optional(),
  symbol: z.string().max(255).optional(),
  type: z.string().max(255),
  created_at: z.date(),
  updated_at: z.date(),
  is_factory: z.boolean().default(false),
  nickname: z.string().max(255).optional(),
});

export const Topic = z.object({
  id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  name: z.string().max(255),
  community_id: z.string().max(255),
  description: z.string().default(''),
  telegram: z.string().max(255).optional().nullable(),
  featured_in_sidebar: z.boolean().default(false),
  featured_in_new_post: z.boolean().default(false),
  default_offchain_template: z.string().optional().nullable(),
  order: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT).optional(),
  channel_id: z.string().max(255).optional().nullable(),
  group_ids: z.array(z.number()).default([]),
  default_offchain_template_backup: z.string().optional().nullable(),
});

export const GenerateStakeholderGroups = {
  input: z.object({}),
  output: Community.extend({
    groups: z.array(Group).optional(),
  }),
};
