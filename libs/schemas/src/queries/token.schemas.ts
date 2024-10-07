import { z } from 'zod';
import { Token } from '../entities';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const GetTokens = {
  input: PaginationParamsSchema.extend({
    search: z.string().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: Token.array(),
  }),
};
