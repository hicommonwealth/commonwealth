import z from 'zod';
import { Comment } from '../entities';
import { PG_INT, zBoolean } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';
import { CommentView, ReactionView } from './thread.schemas';

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

export const CommentsView = CommentView.extend({
  reactions: z.array(ReactionView).nullish(),
});

export const GetComments = {
  input: PaginationParamsSchema.extend({
    thread_id: PG_INT,
    comment_id: PG_INT.optional(),
    parent_id: PG_INT.optional(),
    include_reactions: zBoolean.default(false),
  }),
  output: PaginatedResultSchema.extend({
    // TODO: fix return types, they break for
    // 1. some reactions/version_histories have invalid data types
    // 2. the Date/string types are invalid
    // 3. some keys that are always defined are marked as optional/nullish + vice versa
    results: z.array(z.any()),
  }),
};
