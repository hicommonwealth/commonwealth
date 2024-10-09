import { ChainBase } from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT } from '../utils';

export const Token = z.object({
  // 1. Regular fields are nullish when nullable instead of optional
  name: z.string(),
  icon_url: z.string().nullish(),
  description: z.string().nullish(),
  symbol: z.string(),
  chain_node_id: PG_INT,
  base: z.nativeEnum(ChainBase),
  author_address: z.string(),
  community_id: z.string(),
  launchpad_contract_address: z.string(),
  uniswap_pool_address: z.string().optional(),

  // 2. Timestamps are managed by sequelize, thus optional
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
