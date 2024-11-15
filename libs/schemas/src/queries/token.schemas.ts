import { z } from 'zod';
import { Token } from '../entities';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const TokenView = Token.extend({
  community_id: z.string(),
  initial_supply: z.string(),
  launchpad_liquidity: z.string(),
  latest_price: z.string().nullish(),
  old_price: z.string().nullish(),
});

export const GetTokens = {
  input: PaginationParamsSchema.extend({
    search: z.string().optional(),
    order_by: z.enum(['name']).optional(),
    with_stats: z.boolean().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: TokenView.array(),
  }),
};
