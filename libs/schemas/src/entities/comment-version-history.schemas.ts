import { z } from 'zod';
import { PG_INT } from '../utils';

export const CommentVersionHistory = z.object({
  id: PG_INT.optional(),
  comment_id: PG_INT,
  address: z.string(),
  text: z.string(),
  created_at: z.date().optional(),
});
