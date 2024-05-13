import { z } from 'zod';
import { PG_INT } from '../utils';

export const Tag = z.object({
  id: PG_INT.optional(),
  name: z.string(),
});
