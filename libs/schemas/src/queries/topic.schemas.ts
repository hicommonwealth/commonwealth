import { z } from 'zod';
import { Topic } from '../entities';
import { PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const GetTopics = {
  input: PaginationParamsSchema.extend({
    community_id: z.string(),
    topic_id: PG_INT.optional(),
    include_threads: z.coerce.boolean(),
  }),
  output: PaginatedResultSchema.extend({
    results: Topic.array(),
  }),
};
