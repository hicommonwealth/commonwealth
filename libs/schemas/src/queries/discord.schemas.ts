import { z } from 'zod';
import { AuthContext } from '../context';

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
  context: AuthContext,
};
