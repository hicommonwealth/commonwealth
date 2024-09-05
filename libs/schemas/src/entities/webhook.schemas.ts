import { z } from 'zod';
import { PG_INT } from '../utils';
import { Community } from './community.schemas';

export const WebhookSupportedEvents = z.union([
  z.literal('ThreadCreated'),
  z.literal('CommentCreated'),
]);

export const Webhook = z.object({
  id: PG_INT.optional(),
  url: z.string(),
  destination: z.string(),
  events: z.array(WebhookSupportedEvents),
  community_id: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  Community: Community.optional(),
});
