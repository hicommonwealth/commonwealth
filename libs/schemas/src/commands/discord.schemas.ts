import { z } from 'zod';
import { AuthContext } from '../context';

export const RemoveDiscordBotConfig = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
  context: AuthContext,
};

export const CreateDiscordBotConfig = {
  input: z.object({
    community_id: z.string(),
    verification_token: z.string(),
  }),
  output: z.object({
    message: z.string(),
  }),
  context: AuthContext,
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
  context: AuthContext,
};
