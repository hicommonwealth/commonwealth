import { z } from 'zod';
import { Token } from '../entities';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const TokenView = Token.extend({
  launchpad_liquidity: z.string(),
  latest_price: z.number().nullish(),
  old_price: z.number().nullish(),
});

export const GetTokens = {
  input: PaginationParamsSchema.extend({
    search: z.string().optional(),
    order_by: z.enum(['name']).optional(),
    with_stats: z.boolean().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: TokenView.extend({ community_id: z.string() }).array(),
  }),
};
