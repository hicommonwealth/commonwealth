import z from 'zod';
import { Address, Comment, Thread, User } from '../entities';
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
    include_reactions: zBoolean.default(false),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(CommentsView),
  }),
};

// Similar to GetComments but used exclusively in our client (LEGACY)
export const ViewComments = {
  input: z.object({
    thread_id: PG_INT,
  }),
  output: Comment.extend({
    last_edited: z.string().nullish(),
    community_id: z.string(),
    Address: Address.extend({
      User: User,
    }),
    Thread: Thread,
  }).array(),
};
