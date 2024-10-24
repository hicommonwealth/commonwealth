import { z } from 'zod';
import { PG_INT } from '../utils';

export const Token = z.object({
  // derivable from creation event
  token_address: z.string(),
  namespace: z.string(),
  name: z.string(),
  symbol: z.string(),
  initial_supply: z.number(),
  is_locked: z.boolean().default(false),
  chain_node_id: PG_INT,

  // use specified
  icon_url: z.string().nullish(),
  description: z.string().nullish(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
