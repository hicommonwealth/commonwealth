import {
  configure,
  requiredInEnvironmentServices,
  config as target,
  WebServices,
} from '@hicommonwealth/core';
import { z } from 'zod';

const { RAILWAY_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_PARENT_ENV_ID } =
  process.env;

export const config = configure(
  [target],
  {
    RAILWAY: {
      TOKEN: RAILWAY_TOKEN!,
      REVIEW_APPS: {
        PROJECT_ID: RAILWAY_PROJECT_ID!,
        PARENT_ENV_ID: RAILWAY_PARENT_ENV_ID!,
      },
    },
  },
  z.object({
    RAILWAY: z
      .object({
        TOKEN: z
          .string()
          .describe('A Railway personal/team token (NOT environment specific)'),
        REVIEW_APPS: z.object({
          PROJECT_ID: z
            .string()
            .describe(
              'A Railway project id in which all operations will take place',
            ),
          PARENT_ENV_ID: z
            .string()
            .optional()
            .refine(
              requiredInEnvironmentServices({
                config: target,
                requiredAppEnvs: ['CI'],
                // TODO: should be Railway services
                requiredServices: WebServices,
              }),
            )
            .describe(
              'The environment id to fork from when deploying a new review app',
            ),
        }),
      })
      .optional()
      .refine(
        requiredInEnvironmentServices({
          config: target,
          requiredAppEnvs: ['CI'],
          requiredServices: WebServices,
        }),
      ),
  }),
);
