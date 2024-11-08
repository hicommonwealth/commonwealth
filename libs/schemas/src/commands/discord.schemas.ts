import { z } from 'zod';
import { AuthContextSchema } from '../auth';

export const RemoveDiscordBotConfig = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
  auth_context: AuthContextSchema,
};

export const CreateDiscordBotConfig = {
  input: z.object({
    community_id: z.string(),
    verification_token: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
  auth_context: AuthContextSchema,
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
  auth_context: AuthContextSchema,
};
