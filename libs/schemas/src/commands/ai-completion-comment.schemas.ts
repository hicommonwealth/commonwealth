import { z } from 'zod';
import { ThreadContext } from '../context';
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
    thread_id: PG_INT,
    parent_comment_id: PG_INT.optional(),
    content: z.string().min(1),
  }),
  output: z.object({
    token: z.string().uuid(),
    expires_at: z.coerce.date(),
    id: PG_INT.optional(),
  }),
  context: ThreadContext,
};
