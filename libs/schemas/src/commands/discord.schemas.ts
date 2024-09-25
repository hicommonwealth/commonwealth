import { z } from 'zod';

export const RemoveDiscordBotConfig = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
};

export const CreateDiscordBotConfig = {
  input: z.object({
    community_id: z.string(),
    verification_token: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
};

export const SetDiscordBotConfig = {
  input: z.object({
    community_id: z.string(),
    guild_id: z.string().optional(),
    verification_token: z.string().optional(),
  }),
  output: z.object({
    message: z.string(),
    discordConfigId: z.number().nullish(),
  }),
};
