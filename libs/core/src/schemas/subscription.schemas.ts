import z from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../constants';
import { NotificationCategories } from '../types';

export const Subscription = z.object({
  id: z.number(),
  subscriber_id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  category_id: z.nativeEnum(NotificationCategories),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date(),
  immediate_email: z.boolean().default(false),
  community_id: z.string().max(255).optional().nullable(),
  thread_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional()
    .nullable(),
  comment_id: z
    .number()
    .int()
    .min(MIN_SCHEMA_INT)
    .max(MAX_SCHEMA_INT)
    .optional()
    .nullable(),
  snapshot_id: z.string().max(255).optional().nullable(),
});
