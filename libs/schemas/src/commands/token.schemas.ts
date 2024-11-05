import { z } from 'zod';
import { LaunchpadTrade, Token } from '../entities';

export const CreateToken = {
  input: z.object({
    community_id: z.string(),
    transaction_hash: z.string().length(66),
    chain_node_id: z.number(),
    description: z.string().nullish(),
    icon_url: z.string().nullish(),
  }),
  output: Token,
};

export const CreateLaunchpadTrade = {
  input: z.object({
    eth_chain_id: z.number(),
    transaction_hash: z.string().length(66),
  }),
  output: LaunchpadTrade,
};
