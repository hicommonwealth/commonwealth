import { Community, PG_INT } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const Webhook = z.object({
  id: PG_INT.optional(),
  url: z.string(),
  destination: z.string(),
  events: z.array(z.string()),
  community_id: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  Community: Community.optional(),
});
