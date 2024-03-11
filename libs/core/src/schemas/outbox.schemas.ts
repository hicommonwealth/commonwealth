import { z } from 'zod';
import { schemas } from './events.schemas';

export const Outbox = z.object({
  id: z.number(),
  event_name: z.string(),
  // TODO: should automatically include all event schemas
  event_payload: z.union([
    schemas.ThreadCreated,
    schemas.CommentCreated,
    schemas.GroupCreated,
    schemas.CommunityCreated,
  ]),
  relayed: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});
