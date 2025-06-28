import z from 'zod';
import { VerifiedContext } from '../context';
import { PG_INT, zBoolean } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';
import { CommentView, ReactionView } from './thread.schemas';

export const CommentSearchView = z.object({
  type: z.literal('comment'),
  id: PG_INT,
  community_id: z.string(),
  thread_id: PG_INT,
  address_id: PG_INT,
  address: z.string(),
  address_community_id: z.string(),
  title: z.string(),
  body: z.string(),
  rank: z.number(),
  created_at: z.date().or(z.string()).nullish(),
});

export const SearchComments = {
  input: PaginationParamsSchema.extend({
    community_id: z.string(),
    search: z.string(),
    order_by: z.string().optional().default('created_at'),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(CommentSearchView),
  }),
  context: VerifiedContext,
};

export const CommentsView = CommentView.extend({
  reactions: z.array(ReactionView).nullish(),
  user_tier: z.number().nullish(),
});
export const GetCommentsOrderBy = z.enum(['newest', 'oldest', 'mostLikes']);
export const GetComments = {
  input: PaginationParamsSchema.extend({
    thread_id: PG_INT.optional(),
    comment_id: PG_INT.optional(),
    parent_id: PG_INT.optional(),
    include_reactions: zBoolean.default(false),
    include_spam_comments: zBoolean.optional().default(false),
    is_chat_mode: zBoolean.optional().default(false),
    order_by: GetCommentsOrderBy.optional().default('newest'),
  }).omit({
    order_direction: true,
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(CommentsView),
  }),
};
