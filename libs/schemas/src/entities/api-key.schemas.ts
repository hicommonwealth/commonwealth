import { z } from 'zod';
import { PG_INT } from '../utils';

export const ApiKey = z.object({
  user_id: PG_INT.optional(),
  hashed_api_key: z.string(),
  salt: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
