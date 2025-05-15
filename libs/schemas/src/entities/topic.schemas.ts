import { z } from 'zod';
import { PG_INT } from '../utils';

export enum TopicWeightedVoting {
  Stake = 'stake',
  ERC20 = 'erc20',
  SPL = 'spl',
  SuiNative = 'sui_native',
  SuiToken = 'sui_token',
}

export const Topic = z.object({
  id: PG_INT.optional(),
  name: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .default('General')
    .refine(
      (v) => !v.match(/["<>%{}|\\/^`]/g),
      'Name must not contain special characters',
    ),
  community_id: z.string().max(255),
  description: z.string().default(''),
  telegram: z.string().max(255).nullish(),
  featured_in_sidebar: z.boolean().default(false),
  featured_in_new_post: z.boolean().default(false),
  default_offchain_template: z.string().nullish(),
  order: PG_INT.nullish(),
  channel_id: z.string().max(255).nullish(),
  group_ids: z.array(PG_INT).default([]),
  default_offchain_template_backup: z.string().nullish(),
  weighted_voting: z.nativeEnum(TopicWeightedVoting).nullish(),
  chain_node_id: z
    .number()
    .int()
    .nullish()
    .describe('token chain node ID, used for ERC20 topics'),
  token_address: z
    .string()
    .nullish()
    .describe(
      'token address, used for ERC20/SPL/SuiToken topics (for SuiToken, this stores the coin type)',
    ),
  token_symbol: z
    .string()
    .nullish()
    .describe('token symbol, used for token-based topics'),
  vote_weight_multiplier: z
    .number()
    .gt(0)
    .nullish()
    .describe('vote weight multiplier, used for token weighted topics'),
  token_decimals: z
    .number()
    .gte(0)
    .nullish()
    .describe('number of decimals of token'),
  allow_tokenized_threads: z
    .boolean()
    .optional()
    .describe('Allows a thread in this topic to be tokenized'),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().nullish(),
  archived_at: z.coerce.date().nullish(),
});
