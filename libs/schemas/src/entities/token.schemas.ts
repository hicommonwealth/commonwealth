import { z } from 'zod';
import { PG_ETH } from '../utils';

export const Token = z.object({
  // derivable from creation event
  token_address: z.string().describe('Address of the token'),
  namespace: z.string().describe('Namespace associated with the token'),
  name: z.string().describe('Name of the token'),
  symbol: z.string().describe('Symbol of the token'),
  initial_supply: PG_ETH.describe(
    'Initial supply of the token before deploying to uniswap',
  ),
  liquidity_transferred: z
    .boolean()
    .default(false)
    .describe('False if the token is not yet deployed to uniswap'),
  launchpad_liquidity: PG_ETH.describe(
    'The amount of tokens (portion of the initial_supply) given to the bonding ' +
      'curve. Once this amount of tokens is sold the rest of the remaining initial_supply is transferred to Uniswap',
  ),
  eth_market_cap_target: PG_ETH.describe(
    'The amount in eth (wei) that must be sold/bought before liquidity is transferred to Uniswap',
  ),

  // use specified
  icon_url: z
    .string()
    .nullish()
    .describe('Icon url of the token (platform only)'),
  description: z
    .string()
    .nullish()
    .describe('description of the token (platform only)'),

  created_at: z.coerce.date().optional().describe('Date the token was created'),
  updated_at: z.coerce
    .date()
    .optional()
    .describe('Date the token was updated (platform only)'),
});
