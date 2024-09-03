import {
  ALL_COMMUNITIES,
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
    eth_chain_id: z.number().optional(),
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

export const UpdateCommunity = {
  input: z.object({
    id: z.string(),
    namespace: z.string(),
    txHash: z.string(),
    address: z.string(),
  }),
  output: Community,
};

export const GenerateStakeholderGroups = {
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    groups: z.array(Group),
    created: z.boolean(),
  }),
};
