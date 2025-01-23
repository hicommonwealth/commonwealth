import { z } from 'zod';

export const CommunityIndexer = z.object({
  id: z.string(),
  status: z.enum(['idle', 'pending', 'error']),
  last_checked: z.boolean(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
