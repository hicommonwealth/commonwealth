import { createHash } from 'crypto';
import * as dotenv from 'dotenv';
import _ from 'lodash';
import { ZodType, z } from 'zod';

dotenv.config({ path: '../../.env' });

const APP_ENV_PASSWORD_HASH =
  '7f5c0fe24e27b24fcab364f319e488fffe99104b8f82bec64b6bc82c3a729090';

const Environments = ['development', 'test', 'staging', 'production'] as const;
const AppEnvironments = [
  'local',
  'CI',
  'frick',
  'frack',
  'beta',
  'demo',
  'production',
  'discobot',
  'snapshot',
] as const;
type Environment = typeof Environments[number];
type AppEnvironment = typeof AppEnvironments[number];

/**
 * Extends target config with payload after validating schema
 *
 * @param target target payload
 * @param extend extended payload
 * @param schema extended schema
 * @returns extended config
 */
export const configure = <T, E extends Record<string, unknown>>(
  target: Readonly<T>,
  extend: Readonly<E>,
  schema: ZodType<E>,
): Readonly<T & E> =>
  _.merge(target || {}, schema.parse(extend)) as Readonly<T & E>;

const {
  APP_ENV,
  APP_ENV_PASSWORD,
  NODE_ENV,
  IS_CI,
  SERVER_URL,
  PORT: _PORT,
  ROLLBAR_SERVER_TOKEN: _ROLLBAR_SERVER_TOKEN,
  ROLLBAR_ENV: _ROLLBAR_ENV,
  TEST_WITHOUT_LOGS,
} = process.env;

const DEFAULTS = {
  NODE_ENV: 'development',
  PORT: 8080,
  get SERVER_URL() {
    return `http://localhost:${this.PORT}`;
  },
  ROLLBAR_ENV: 'local',
  ROLLBAR_SERVER_TOKEN: '',
};

export const config = configure(
  {},
  {
    APP_ENV: APP_ENV as AppEnvironment,
    APP_ENV_PASSWORD: APP_ENV_PASSWORD,
    NODE_ENV: (NODE_ENV || DEFAULTS.NODE_ENV) as Environment,
    IS_CI: IS_CI === 'true',
    SERVER_URL: SERVER_URL ?? DEFAULTS.SERVER_URL,
    PORT: _PORT ? parseInt(_PORT, 10) : DEFAULTS.PORT,
    LOGGING: {
      ROLLBAR_SERVER_TOKEN:
        _ROLLBAR_SERVER_TOKEN || DEFAULTS.ROLLBAR_SERVER_TOKEN,
      ROLLBAR_ENV: _ROLLBAR_ENV || DEFAULTS.ROLLBAR_ENV,
      TEST_WITHOUT_LOGS: TEST_WITHOUT_LOGS === 'true',
    },
  },
  z.object({
    APP_ENV: z.enum(AppEnvironments).refine(() => {
      // prevent APP_ENV from being set to 'production' without the correct password
      if (APP_ENV === 'production' && !APP_ENV_PASSWORD) return false;
      else if (APP_ENV === 'production' && APP_ENV_PASSWORD) {
        return (
          createHash('sha256').update(APP_ENV_PASSWORD).digest('hex') ===
          APP_ENV_PASSWORD_HASH
        );
      }
      return true;
    }),
    APP_ENV_PASSWORD: z
      .string()
      .optional()
      .refine(() => !(APP_ENV === 'production' && !APP_ENV_PASSWORD)),
    NODE_ENV: z.enum(Environments),
    IS_CI: z.boolean(),
    SERVER_URL: z
      .string()
      .refine(
        (data) =>
          !(
            APP_ENV !== 'local' &&
            APP_ENV !== 'CI' &&
            data === DEFAULTS.SERVER_URL
          ),
      ),
    PORT: z.number().int().min(1000).max(65535),
    LOGGING: z
      .object({
        ROLLBAR_SERVER_TOKEN: z.string(),
        ROLLBAR_ENV: z.string(),
        TEST_WITHOUT_LOGS: z.boolean(),
      })
      .refine(
        (data) => {
          if (
            APP_ENV !== 'production' &&
            data.ROLLBAR_SERVER_TOKEN !== DEFAULTS.ROLLBAR_SERVER_TOKEN
          )
            return false;
          else if (
            APP_ENV === 'production' &&
            data.ROLLBAR_SERVER_TOKEN === DEFAULTS.ROLLBAR_SERVER_TOKEN
          )
            return false;
          else if (
            APP_ENV === 'production' &&
            data.ROLLBAR_SERVER_TOKEN !== DEFAULTS.ROLLBAR_SERVER_TOKEN &&
            data.ROLLBAR_ENV === DEFAULTS.ROLLBAR_ENV
          )
            return false;
          return true;
        },
        {
          message:
            'ROLLBAR_SERVER_TOKEN and ROLLBAR_ENV may only be set in production to a non-default value.',
        },
      ),
  }),
);
