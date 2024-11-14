import { z } from 'zod';
import { Token } from '../entities';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const GetTokens = {
  input: PaginationParamsSchema.extend({
    search: z.string().optional(),
    order_by: z.enum(['name']).optional(),
    with_stats: z.boolean().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: Token.extend({
      community_id: z.string(),
      latest_price: z.string().optional(),
      old_price: z.string().optional(),
    }).array(),
  }),
};
