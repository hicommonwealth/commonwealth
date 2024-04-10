import { z } from 'zod';
import { ContestAction } from '../projections';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const GetAllContests = {
  input: PaginationParamsSchema.extend({
    contest_id: z.number().int().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(ContestAction),
  }),
};
