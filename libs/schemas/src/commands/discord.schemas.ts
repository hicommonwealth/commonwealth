import { z } from 'zod';

export const RemoveDiscordBotConfig = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
};
