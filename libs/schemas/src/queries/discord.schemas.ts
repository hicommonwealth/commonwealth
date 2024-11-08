import { z } from 'zod';
import { AuthContextSchema } from '../auth';

export const GetDiscordChannels = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({
    channels: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
    forumChannels: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
  }),
  auth_context: AuthContextSchema,
};
