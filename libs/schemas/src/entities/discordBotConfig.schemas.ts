import { z } from 'zod';
import { PG_INT } from '../utils';

export const DiscordBotConfig = z.object({
  id: PG_INT.optional(),
  community_id: z.string(),
  guild_id: z.string().nullish(),
  verification_token: z.string().nullish(),
  token_expiration: z.coerce.date().nullish(),
  verified: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
