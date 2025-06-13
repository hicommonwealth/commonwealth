import { z } from 'zod/v4';

export const DiscordEventBase = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
  }),
  title: z.string(),
  content: z.string(),
  message_id: z.string(),
  channel_id: z.string(),
  parent_channel_id: z.string(),
  guild_id: z.string(),
  imageUrls: z.array(z.string()),
});

export const DiscordUser = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  verified: z.boolean(),
});
