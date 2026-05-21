import { z } from 'zod';
import { PG_INT } from '../utils';

export const AICompletionToken = z.object({
  id: PG_INT.optional(),
  token: z.string().uuid().optional(),
  user_id: PG_INT,
  community_id: z.string(),
  thread_id: PG_INT,
  parent_comment_id: PG_INT.nullish(),
  content: z.string(),
  expires_at: z.coerce.date(),
  used_at: z.coerce.date().nullish(),
  comment_id: PG_INT.nullish(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const AICompletionTokenCreation = z.object({
  user_id: PG_INT,
  community_id: z.string(),
  thread_id: PG_INT,
  parent_comment_id: PG_INT.nullish(),
  content: z.string(),
  expires_at: z.coerce.date(),
});
