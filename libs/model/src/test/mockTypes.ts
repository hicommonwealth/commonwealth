import z from 'zod';
import { models } from '../database';
import { SchemaWithModel } from './seed';

const MAX_SCHEMA_INT = 1_000_000_000;

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
  mockDefaults: () => ({
    isAdmin: false,
    emailVerified: true,
    selected_community_id: 'etheruem',
  }),
  model: models.User,
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
  mockDefaults: () => ({}),
  model: models.ChainNode,
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
  mockDefaults: () => ({
    chain_node_id: 1,
    abi_id: null,
  }),
  model: models.Contract,
};

/*
  === Topic ===
*/

const topicSchema = z.object({});
export const TopicSchema: SchemaWithModel<typeof topicSchema> = {
  schema: topicSchema,
  mockDefaults: () => ({}),
  model: models.Topic,
};

/*
  === Community ===
*/

const communitySchema = z.object({});
export const CommunitySchema: SchemaWithModel<typeof communitySchema> = {
  schema: communitySchema,
  mockDefaults: () => ({}),
  model: models.Community,
};

/*
  === CommunityStake ===
*/

const communityStake = z.object({});
export const CommunityStakeSchema: SchemaWithModel<typeof communityStake> = {
  schema: communityStake,
  mockDefaults: () => ({}),
  model: models.CommunityStake,
};

/*
  === Address ===
*/

const addressSchema = z.object({});
export const AddressSchema: SchemaWithModel<typeof addressSchema> = {
  schema: addressSchema,
  mockDefaults: () => ({}),
  model: models.Address,
};

/*
  === NotificationCategory ===
*/

const notificationSchema = z.object({});
export const NotificationCategorySchema: SchemaWithModel<
  typeof notificationSchema
> = {
  schema: notificationSchema,
  mockDefaults: () => ({}),
  model: models.NotificationCategory,
};

/*
  === Subscription ===
*/

const subscriptionSchema = z.object({});
export const SubscriptionSchema: SchemaWithModel<typeof subscriptionSchema> = {
  schema: subscriptionSchema,
  mockDefaults: () => ({}),
  model: models.Subscription,
};

/*
  === SnapshotProposal ===
*/

const snapshotSpaceSchema = z.object({});
export const SnapshotProposalSchema: SchemaWithModel<
  typeof snapshotSpaceSchema
> = {
  schema: snapshotSpaceSchema,
  mockDefaults: () => ({}),
  model: models.SnapshotProposal,
};

/*
  === SnapshotSpace ===
*/

const snapshotProposalSchema = z.object({});
export const SnapshotSpaceSchema: SchemaWithModel<
  typeof snapshotProposalSchema
> = {
  schema: snapshotProposalSchema,
  mockDefaults: () => ({}),
  model: models.SnapshotSpace,
};
