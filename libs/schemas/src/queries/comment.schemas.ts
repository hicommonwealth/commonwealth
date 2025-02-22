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

export const GetCommentsOrderBy = z.enum(['newest', 'oldest', 'mostLikes']);

export const GetComments = {
  input: PaginationParamsSchema.extend({
    thread_id: PG_INT,
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

export const GetCommentById = {
  input: z.object({
    comment_id: PG_INT,
  }),
  // output: CommentsView,
  output: z.any(),
};
