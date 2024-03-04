import z from 'zod';
import { NotificationCategories } from '../types';

export const Subscription = z.object({
  id: z.number(),
  subscriber_id: z.number().int(),
  category_id: z.nativeEnum(NotificationCategories),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date(),
  immediate_email: z.boolean().default(false),
  community_id: z.string().max(255).optional().nullable(),
  thread_id: z.number().int().optional().nullable(),
  comment_id: z.number().int().optional().nullable(),
  snapshot_id: z.string().max(255).optional().nullable(),
});
