import { config as adapters_config } from '@hicommonwealth/adapters';
import { configure } from '@hicommonwealth/core';
import { config as model_config } from '@hicommonwealth/model';
import { z } from 'zod';

const { DISCORD_TOKEN, CW_BOT_KEY } = process.env;

export const config = configure(
  { ...model_config, ...adapters_config },
  {
    DISCORD: {
      CW_BOT_KEY,
      DISCORD_TOKEN,
    },
  },
  z.object({
    DISCORD: z.object({
      CW_BOT_KEY: z.string().optional(),
      DISCORD_TOKEN: z.string().optional(),
    }),
  }),
);
