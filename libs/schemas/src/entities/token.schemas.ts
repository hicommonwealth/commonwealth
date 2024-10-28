import { z } from 'zod';
import { PG_ETH } from '../utils';

export const Token = z.object({
  // derivable from creation event
  token_address: z.string(),
  namespace: z.string(),
  name: z.string(),
  symbol: z.string(),
  initial_supply: PG_ETH,
  is_locked: z.boolean().default(false),

  // use specified
  icon_url: z.string().nullish(),
  description: z.string().nullish(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
