import { z } from 'zod';
import { LaunchpadToken } from '../entities';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const TokenView = LaunchpadToken.extend({
  launchpad_liquidity: z.string(),
  latest_price: z.number().nullish(),
  old_price: z.number().nullish(),
});

export const GetTokens = {
  input: PaginationParamsSchema.extend({
    search: z.string().optional(),
    order_by: z.enum(['name', 'price', 'market_cap']).optional(),
    with_stats: z.boolean().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: TokenView.extend({ community_id: z.string() }).array(),
  }),
};

export const GetToken = {
  input: z
    .object({
      community_id: z.string().optional(),
      thread_id: z.number().optional(),
      with_stats: z.boolean().optional(),
    })
    .refine(
      (data) => data.community_id !== undefined || data.thread_id !== undefined,
      {
        message: 'Either community_id or thread_id must be provided',
      },
    ),
  output: z.union([TokenView, z.null()]),
};
