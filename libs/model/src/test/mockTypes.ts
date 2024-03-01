import {
  ChainBase,
  ChainNetwork,
  ChainType,
  DefaultPage,
} from '@hicommonwealth/core';
import z from 'zod';
import { models } from '../database';
import { SchemaWithModel } from './seed';

const MAX_SCHEMA_INT = 1_000_000_000;

// TODO: Replace these mock zod schemas with
//       real schemas for single source of truth

/*
  === User ===
*/

const userZodSchema = z.object({
  id: z.number().int(),
  email: z.string().max(255).email().optional(),
  isAdmin: z.boolean().optional(),
  disableRichText: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  selected_community_id: z.string().max(255).optional(),
  emailNotificationInterval: z.enum(['week', 'never']).optional(),
});
export const UserSchema: SchemaWithModel<typeof userZodSchema> = {
  schema: userZodSchema,
  model: models.User,
  mockDefaults: () => ({
    isAdmin: false,
    emailVerified: true,
    selected_community_id: 'etheruem',
  }),
};

/*
  === ChainNode ===
*/

const chainNodeSchema = z.object({
  id: z.number().int(),
  url: z.string().max(255),
  eth_chain_id: z.number().int().max(MAX_SCHEMA_INT).optional(),
  alt_wallet_url: z.string().max(255).optional(),
  private_url: z.string().max(255).optional(),
  balance_type: z.string().max(255).optional(),
  name: z.string().max(255),
  description: z.string().max(255).optional(),
  ss58: z.number().int().max(MAX_SCHEMA_INT).optional(),
  bech32: z.string().max(255).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  cosmos_chain_id: z
    .string()
    .regex(/[a-z0-9]+/)
    .optional(),
  health: z.string().max(255).optional(),
});
export const ChainNodeSchema: SchemaWithModel<typeof chainNodeSchema> = {
  schema: chainNodeSchema,
  model: models.ChainNode,
  mockDefaults: () => ({}),
};

/*
  === Contract ===
*/

const contractSchema = z.object({
  id: z.number().int(),
  address: z.string().max(255),
  chain_node_id: z.number().int().max(MAX_SCHEMA_INT),
  abi_id: z.number().int().max(MAX_SCHEMA_INT).optional().nullable(),
  decimals: z.number().int().max(MAX_SCHEMA_INT).optional(),
  token_name: z.string().max(255).optional(),
  symbol: z.string().max(255).optional(),
  type: z.string().max(255),
  created_at: z.date(),
  updated_at: z.date(),
  is_factory: z.boolean().default(false),
  nickname: z.string().max(255).optional(),
});
export const ContractSchema: SchemaWithModel<typeof contractSchema> = {
  schema: contractSchema,
  model: models.Contract,
  mockDefaults: () => ({
    chain_node_id: 1,
    abi_id: null,
  }),
};

/*
  === Community ===
*/

const communitySchema = z.object({
  id: z.string(),
  name: z.string(),
  chain_node_id: z.number().int().max(MAX_SCHEMA_INT),
  default_symbol: z.string(),
  network: z.nativeEnum(ChainNetwork),
  base: z.nativeEnum(ChainBase),
  icon_url: z.string(),
  active: z.boolean(),
  type: z.nativeEnum(ChainType),
  description: z.string().optional(),
  social_links: z.array(z.string()).optional(),
  ss58_prefix: z.number().int().max(MAX_SCHEMA_INT).optional(),
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
  discord_config_id: z.number().int().max(MAX_SCHEMA_INT).optional(),
  category: z.unknown().optional(), // Assuming category can be any type
  discord_bot_webhooks_enabled: z.boolean().optional(),
  directory_page_enabled: z.boolean().optional(),
  directory_page_chain_node_id: z.number().int().max(MAX_SCHEMA_INT).optional(),
  namespace: z.string().optional(),
  redirect: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});
export const CommunitySchema: SchemaWithModel<typeof communitySchema> = {
  schema: communitySchema,
  model: models.Community,
  allowedGeneratedProps: ['id'],
  mockDefaults: () => ({
    chain_node_id: 1,
  }),
};

/*
  === Topic ===
*/

const topicSchema = z.object({
  id: z.number().int(),
  name: z.string().max(255),
  community_id: z.string().max(255),
  description: z.string().default(''),
  telegram: z.string().max(255).optional().nullable(),
  featured_in_sidebar: z.boolean().default(false),
  featured_in_new_post: z.boolean().default(false),
  default_offchain_template: z.string().optional().nullable(),
  order: z.number().int().max(MAX_SCHEMA_INT).optional(),
  channel_id: z.string().max(255).optional().nullable(),
  group_ids: z.array(z.number().max(MAX_SCHEMA_INT)).default([]),
  default_offchain_template_backup: z.string().optional().nullable(),
});
export const TopicSchema: SchemaWithModel<typeof topicSchema> = {
  schema: topicSchema,
  model: models.Topic,
  mockDefaults: () => ({
    community_id: 'ethereum',
  }),
};

/*
  === CommunityStake ===
*/

const communityStake = z.object({
  community_id: z.string().optional(),
  stake_id: z.number().int().max(MAX_SCHEMA_INT).optional(),
  stake_token: z.string().optional(),
  vote_weight: z.number().int().max(MAX_SCHEMA_INT).optional(),
  stake_enabled: z.boolean().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});
export const CommunityStakeSchema: SchemaWithModel<typeof communityStake> = {
  schema: communityStake,
  model: models.CommunityStake,
  mockDefaults: () => ({
    community_id: 'ethereum',
    stake_enabled: true,
  }),
  buildFindQuery: (data) => ({
    where: {
      community_id: data.community_id,
      stake_id: data.stake_id,
    },
  }),
};

/*
  === Address ===
*/

const addressSchema = z.object({});
export const AddressSchema: SchemaWithModel<typeof addressSchema> = {
  schema: addressSchema,
  model: models.Address,
  mockDefaults: () => ({}),
};

/*
  === NotificationCategory ===
*/

const notificationSchema = z.object({});
export const NotificationCategorySchema: SchemaWithModel<
  typeof notificationSchema
> = {
  schema: notificationSchema,
  model: models.NotificationCategory,
  mockDefaults: () => ({}),
};

/*
  === Subscription ===
*/

const subscriptionSchema = z.object({});
export const SubscriptionSchema: SchemaWithModel<typeof subscriptionSchema> = {
  schema: subscriptionSchema,
  model: models.Subscription,
  mockDefaults: () => ({}),
};

/*
  === SnapshotProposal ===
*/

const snapshotSpaceSchema = z.object({});
export const SnapshotProposalSchema: SchemaWithModel<
  typeof snapshotSpaceSchema
> = {
  schema: snapshotSpaceSchema,
  model: models.SnapshotProposal,
  mockDefaults: () => ({}),
};

/*
  === SnapshotSpace ===
*/

const snapshotProposalSchema = z.object({});
export const SnapshotSpaceSchema: SchemaWithModel<
  typeof snapshotProposalSchema
> = {
  schema: snapshotProposalSchema,
  model: models.SnapshotSpace,
  mockDefaults: () => ({}),
};
