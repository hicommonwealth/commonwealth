import { z } from 'zod';
import { PG_INT } from '../utils';
import { ChainNode } from './chain.schemas';

export const PinnedToken = z.object({
  contract_address: z.string(),
  community_id: z.string(),
  chain_node_id: PG_INT,
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  ChainNode: ChainNode.optional(),
});

export const PinnedTokenWithPrices = PinnedToken.extend({
  prices: z
    .array(
      z.object({
        currency: z.string(),
        value: z.string(),
        lastUpdatedAt: z.string(),
      }),
    )
    .optional(),
});
