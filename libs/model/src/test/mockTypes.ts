import { NotificationCategories } from '@hicommonwealth/core';
import { address, community, group } from '@hicommonwealth/core/src/schemas';
import z from 'zod';
import { models } from '../database';
import { SchemaWithModel } from './seed';

const MAX_SCHEMA_INT = 1_000_000_000;

// TODO: Replace these mock zod schemas with
//       real schemas for single source of truth

/*
  === User ===
*/

const userSchema = z.object({
  id: z.number().int(),
  email: z.string().max(255).email().optional(),
  isAdmin: z.boolean().optional(), // excluded
  disableRichText: z.boolean().optional(),
  emailVerified: z.boolean().optional(), // excluded
  selected_community_id: z.string().max(255).optional(),
  emailNotificationInterval: z.enum(['week', 'never']).optional(),
});
export const UserSchema: SchemaWithModel<typeof userSchema> = {
  schema: userSchema,
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
  === Contract ===
*/

const communityContractSchema = z.object({
  id: z.number().int(),
  community_id: z.string().max(255),
  contract_id: z.number().int().max(MAX_SCHEMA_INT),
  created_at: z.date(),
  updated_at: z.date(),
});
export const CommunityContractSchema: SchemaWithModel<
  typeof communityContractSchema
> = {
  schema: communityContractSchema,
  model: models.CommunityContract,
  mockDefaults: () => ({
    community_id: 'ethereum',
    contract_id: 1,
  }),
};

/*
  === Community ===
*/

export const CommunitySchema: SchemaWithModel<typeof community.Community> = {
  schema: community.Community,
  model: models.Community,
  allowedGeneratedProps: ['id'],
  mockDefaults: (seedNum) => ({
    chain_node_id: 1,
    ss58_prefix: 50_000 + seedNum,
    discord_config_id: 50_000 + seedNum,
    directory_page_chain_node_id: 50_000 + seedNum,
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

export const CommunityStakeSchema: SchemaWithModel<
  typeof community.CommunityStake
> = {
  schema: community.CommunityStake,
  model: models.CommunityStake,
  mockDefaults: (seedNum) => ({
    community_id: 'ethereum',
    stake_enabled: true,
    stake_id: 50_000 + seedNum,
    vote_weight: 50_000 + seedNum,
  }),
  buildQuery: (data) => ({
    where: {
      community_id: data.community_id,
      stake_id: data.stake_id,
    },
  }),
};

/*
  === Profile ===
*/

const profileSchema = z.object({
  id: z.number().int(),
  user_id: z.number().int().max(MAX_SCHEMA_INT),
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
export const ProfileSchema: SchemaWithModel<typeof profileSchema> = {
  schema: profileSchema,
  model: models.Profile,
  mockDefaults: () => ({
    user_id: 1,
  }),
};

/*
  === Address ===
*/

export const AddressSchema: SchemaWithModel<typeof address.Address> = {
  schema: address.Address,
  model: models.Address,
  mockDefaults: () => ({
    community_id: 'ethereum',
    user_id: 1,
    profile_id: 1,
  }),
};

/*
  === NotificationCategory ===
*/

const notificationCategorySchema = z.object({
  name: z.string().max(255),
  description: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});
export const NotificationCategorySchema: SchemaWithModel<
  typeof notificationCategorySchema
> = {
  schema: notificationCategorySchema,
  model: models.NotificationCategory,
  mockDefaults: () => ({}),
  buildQuery: (data) => ({
    where: {
      name: data.name,
    },
  }),
};

/*
  === Subscription ===
*/

const subscriptionSchema = z.object({
  id: z.number(),
  subscriber_id: z.number().int().max(MAX_SCHEMA_INT),
  category_id: z.nativeEnum(NotificationCategories),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date(),
  immediate_email: z.boolean().default(false),
  community_id: z.string().max(255).optional().nullable(),
  thread_id: z.number().int().max(MAX_SCHEMA_INT).optional().nullable(),
  comment_id: z.number().int().max(MAX_SCHEMA_INT).optional().nullable(),
  snapshot_id: z.string().max(255).optional().nullable(),
});
export const SubscriptionSchema: SchemaWithModel<typeof subscriptionSchema> = {
  schema: subscriptionSchema,
  model: models.Subscription,
  mockDefaults: () => ({
    subscriber_id: 1,
    category_id: NotificationCategories.NewThread,
    community_id: 'ethereum',
    thread_id: null,
    comment_id: null,
  }),
};

/*
  === SnapshotProposal ===
*/

const snapshotSpaceSchema = z.object({
  snapshot_space: z.string().max(255),
  created_at: z.date(),
  updated_at: z.date(),
});
export const SnapshotSpaceSchema: SchemaWithModel<typeof snapshotSpaceSchema> =
  {
    schema: snapshotSpaceSchema,
    model: models.SnapshotSpace,
    mockDefaults: () => ({}),
    buildQuery: (data) => ({
      where: {
        snapshot_space: data.snapshot_space,
      },
    }),
  };

/*
  === SnapshotProposal ===
*/

const snapshotProposalSchema = z.object({
  id: z.string().max(255),
  title: z.string().max(255).optional(),
  body: z.string(),
  choices: z.array(z.string().max(255)),
  space: z.string().max(255),
  event: z.string().max(255).optional(),
  start: z.string().max(255).optional(),
  expire: z.string().max(255).optional(),
  is_upstream_deleted: z.string().default('false'),
});
export const SnapshotProposalSchema: SchemaWithModel<
  typeof snapshotProposalSchema
> = {
  schema: snapshotProposalSchema,
  model: models.SnapshotProposal,
  mockDefaults: () => ({}),
  allowedGeneratedProps: ['id'],
};

/*
  === Group ===
*/

export const GroupSchema: SchemaWithModel<typeof group.Group> = {
  schema: group.Group,
  model: models.Group,
  mockDefaults: () => ({
    community_id: 'ethereum',
  }),
};
