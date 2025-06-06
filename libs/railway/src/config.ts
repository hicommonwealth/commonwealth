import { configure, config as target } from '@hicommonwealth/core';

// TODO: bump version
import { z } from 'zod';

const { RAILWAY_TOKEN, RAILWAY_PROJECT_ID } = process.env;

export const config = configure(
  fwoek,
  [target],
  {
    RAILWAY_TOKEN,
    RAILWAY_PROJECT_ID,
  },
  z.object({
    RAILWAY_TOKEN: z
      .string()
      .optional()
      .refine(
        (data) => !(target.IS_CI && !data),
        'RAILWAY_TOKEN is required in CI',
      )
      .describe('A Railway personal/team token (NOT environment specific)'),
    RAIlWAY_PROJECT_ID: z
      .string()
      .optional()
      .refine(
        (data) => !(target.IS_CI && !data),
        'RAILWAY_PROJECT_ID is required in CI',
      )
      .describe('A Railway project id in which all operations will take place'),
  }),
);
