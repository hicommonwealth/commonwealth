import { z } from 'zod';
import { EVM_ADDRESS, PG_ETH, PG_INT } from '../utils';

export const LaunchpadTrade = z.object({
  eth_chain_id: PG_INT,
  transaction_hash: z.string().length(66),
  token_address: EVM_ADDRESS,
  trader_address: EVM_ADDRESS,
  is_buy: z.boolean(),
  community_token_amount: PG_ETH,
  price: PG_ETH,
  floating_supply: PG_ETH,
  timestamp: PG_INT,
});
