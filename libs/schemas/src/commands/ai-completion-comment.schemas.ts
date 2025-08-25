import { z } from 'zod';
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
    user_id: PG_INT,
    community_id: z.string(),
    thread_id: PG_INT,
    parent_comment_id: PG_INT.optional(),
    content: z.string().min(1),
    expires_in_minutes: PG_INT.default(60), // Default 1 hour
  }),
  output: z.object({
    token: z.string().uuid(),
    expires_at: z.coerce.date(),
    id: PG_INT.optional(),
  }),
  context: z.object({}),
};
