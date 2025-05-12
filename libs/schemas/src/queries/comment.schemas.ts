import z from 'zod';
import { PG_INT, zBoolean } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';
import { CommentView, ReactionView } from './thread.schemas';

export const CommentsView = CommentView.extend({
  reactions: z.array(ReactionView).nullish(),
  user_tier: z.number().nullish(),
});

export const SearchComments = {
  input: PaginationParamsSchema.extend({
    community_id: z.string(),
    search: z.string(),
    order_by: z.string().optional().default('created_at'),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(CommentsView),
  }),
};

export const GetCommentsOrderBy = z.enum(['newest', 'oldest', 'mostLikes']);

export const GetComments = {
  input: PaginationParamsSchema.extend({
    thread_id: PG_INT.optional(),
    comment_id: PG_INT.optional(),
    parent_id: PG_INT.optional(),
    include_reactions: zBoolean.default(false),
    include_spam_comments: zBoolean.optional().default(false),
    order_by: GetCommentsOrderBy.optional().default('newest'),
  }).omit({
    order_direction: true,
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(CommentsView),
  }),
};
