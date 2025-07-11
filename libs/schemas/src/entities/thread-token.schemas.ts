import { z } from 'zod';

export const ThreadToken = z.object({
  token_address: z.string(),
  thread_id: z.string(),
  name: z.string(),
  symbol: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  initial_supply: z.number(),
  liquidity_transferred: z.boolean(),
  launchpad_liquidity: z.string(),
  eth_market_cap_target: z.number(),
  creator_address: z.string().nullable().optional(),
});
