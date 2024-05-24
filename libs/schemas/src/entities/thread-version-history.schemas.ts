import { z } from 'zod';
import { PG_INT } from '../utils';

export const ThreadVersionHistory = z.object({
  id: PG_INT.optional(),
  thread_id: PG_INT,
  address: z.string(),
  body: z.string(),
  created_at: z.date().optional(),
});
