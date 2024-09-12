import { z } from 'zod';
import { PG_INT } from '../utils';

export enum TopicWeightedVoting {
  Stake = 'stake',
  ERC20 = 'erc20',
}

export const Topic = z.object({
  id: PG_INT.optional(),
  name: z.string().max(255).default('General'),
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
  chain_node_id: PG_INT.nullish().describe(
    'token chain node ID, used for ERC20 topics',
  ),
  token_address: z
    .string()
    .nullish()
    .describe('token address, used for ERC20 topics'),
  token_symbol: z
    .string()
    .nullish()
    .describe('token symbol, used for ERC20 topics'),
  vote_weight_multiplier: PG_INT.nullish().describe(
    'vote weight multiplier, used for ERC20 topics',
  ),
});
