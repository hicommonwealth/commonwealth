import z from 'zod';
import { Comment } from '../entities';
import { PG_INT, zBoolean } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const SearchComments = {
  input: z.object({
    community_id: z.string(),
    search: z.string(),
    limit: PG_INT.optional().default(20),
    page: PG_INT.int().optional().default(1),
    orderBy: z.string().optional().default('created_at'),
    orderDirection: z.enum(['ASC', 'DESC']).default('DESC'),
  }),
  output: PaginatedResultSchema.extend({
    results: Comment.array(),
  }),
};

export const GetComments = {
  input: PaginationParamsSchema.extend({
    thread_id: PG_INT,
    comment_id: PG_INT.optional(),
    include_user: zBoolean.default(false),
    include_reactions: zBoolean.default(false),
  }),
  output: PaginatedResultSchema.extend({
    results: Comment.extend({
      last_edited: z.coerce.date().optional(),
    }).array(),
  }),
};

// Similar to GetComments but used exclusively in our client (LEGACY)
export const ViewComments = {
  input: z.object({
    thread_id: PG_INT,
  }),
  output: Comment.extend({
    community_id: z.string(),
  }).array(),
};
