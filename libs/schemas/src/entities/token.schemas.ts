import { z } from 'zod';
import { PG_ETH } from '../utils';

export const Token = z.object({
  // derivable from creation event
  token_address: z.string().describe('Address of the token'),
  namespace: z.string().describe('Namespace associated with the token'),
  name: z.string().describe('Name of the token'),
  symbol: z.string().describe('Symbol of the token'),
  initial_supply: z.union([
    PG_ETH.describe('Initial supply of the token before deploying to uniswap'),
    z.any(),
  ]), // TODO: create token returns this value as a string, but schema expects bigint
  is_locked: z
    .boolean()
    .default(false)
    .describe('False if the token is not yet deployed to uniswap'),

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
