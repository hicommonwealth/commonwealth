import { z } from 'zod';
import { PG_INT } from '../utils';

export const CommunityContract = z.object({
  id: PG_INT,
  community_id: z.string().max(255),
  contract_id: PG_INT,

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
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
  is_factory: z.boolean().default(false),
  nickname: z.string().max(255).optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const ContractAbi = z.object({
  id: PG_INT,
  abi: z.record(z.string(), z.unknown()).array(),
  abi_hash: z.string().max(255).nullish(),
  nickname: z.string().max(255).nullish(),
  verified: z.boolean().default(false).nullish(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
