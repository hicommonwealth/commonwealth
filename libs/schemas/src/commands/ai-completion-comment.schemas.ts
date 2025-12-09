import { z } from 'zod';
import { CommentContext } from '../context';
import { Comment } from '../entities';
import { PG_INT } from '../utils';

export const CreateAICompletionComment = {
  input: z.object({
    token: z.string().uuid(),
  }),
  output: Comment.extend({ community_id: z.string() }),
  context: z.object({}),
};

export const CreateAICompletionToken = {
  input: z.object({
    // Thread ID is inferred from the parent comment's thread
    comment_id: PG_INT,
    content: z.string().min(1),
  }),
  output: z.object({
    token: z.string().uuid(),
    expires_at: z.coerce.date(),
    id: PG_INT.optional(),
  }),
  context: CommentContext,
};
