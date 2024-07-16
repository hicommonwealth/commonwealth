import { z } from 'zod';
import { PG_INT } from '../utils';

export const CommentVersionHistory = z.object({
  id: PG_INT.optional(),
  comment_id: PG_INT,
  text: z.string(),
  timestamp: z.date(),
});
