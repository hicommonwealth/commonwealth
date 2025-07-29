import { EVM_ADDRESS, PG_ETH, PG_INT } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const ThreadToken = z.object({
  token_address: z.string(),
  namespace: z.string(),
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

export const ThreadTokenTrade = z.object({
  eth_chain_id: PG_INT,
  transaction_hash: z.string().length(66),
  token_address: EVM_ADDRESS,
  trader_address: EVM_ADDRESS,
  is_buy: z.boolean(),
  community_token_amount: PG_ETH,
  price: z.number().describe('The amount in ETH per token'),
  floating_supply: PG_ETH,
  timestamp: PG_INT,
});
