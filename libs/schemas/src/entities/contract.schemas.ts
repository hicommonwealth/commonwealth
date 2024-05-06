import { z } from 'zod';
import { PG_INT } from '../utils';

export const CommunityContract = z.object({
  id: PG_INT,
  community_id: z.string().max(255),
  contract_id: PG_INT,
  created_at: z.date(),
  updated_at: z.date(),
});

export const Contract = z.object({
  id: PG_INT,
  address: z.string().max(255),
  chain_node_id: PG_INT,
  abi_id: PG_INT.optional().nullable(),
  decimals: PG_INT.optional(),
  token_name: z.string().max(255).optional(),
  symbol: z.string().max(255).optional(),
  type: z.string().max(255),
  created_at: z.date(),
  updated_at: z.date(),
  is_factory: z.boolean().default(false),
  nickname: z.string().max(255).optional(),
});
