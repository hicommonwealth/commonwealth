import { z } from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../../constants';
import { ChainBase, ChainType, CommunityCategoryType } from '../../types';
import { ALL_COMMUNITIES, checkIconSize } from '../../utils';
import { Community } from '../entities.schemas';

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
  output: Community,
};

export const UpdateCommunity = {
  input: z.object({
    namespace: z.string(),
    txHash: z.string(),
    address: z.string(),
  }),
  output: Community,
};
