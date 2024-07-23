import * as dotenv from 'dotenv';
import _ from 'lodash';
import { ZodType, z } from 'zod';

dotenv.config({ path: '../../.env' });

const Environments = ['development', 'test', 'staging', 'production'] as const;
const AppEnvironments = [
  'local',
  'frick',
  'frack',
  'beta',
  'demo',
  'production',
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
  NODE_ENV,
  IS_CI,
  SERVER_URL,
  PORT: _PORT,
  ROLLBAR_SERVER_TOKEN: _ROLLBAR_SERVER_TOKEN,
  ROLLBAR_ENV: _ROLLBAR_ENV,
  TEST_WITHOUT_LOGS,
} = process.env;

const PORT = _PORT ? parseInt(_PORT, 10) : 8080;

export const config = configure(
  {},
  {
    APP_ENV: APP_ENV as AppEnvironment,
    NODE_ENV: (NODE_ENV || 'development') as Environment,
    IS_CI: IS_CI === 'true',
    SERVER_URL:
      SERVER_URL ?? NODE_ENV === 'production'
        ? 'https://commonwealth.im'
        : `http://localhost:${PORT}`,
    PORT,
    LOGGING: {
      ROLLBAR_SERVER_TOKEN: _ROLLBAR_SERVER_TOKEN || '',
      ROLLBAR_ENV: _ROLLBAR_ENV || 'local',
      TEST_WITHOUT_LOGS: TEST_WITHOUT_LOGS === 'true',
    },
  },
  z.object({
    APP_ENV: z.enum(AppEnvironments),
    NODE_ENV: z.enum(Environments),
    IS_CI: z.boolean(),
    SERVER_URL: z.string(),
    PORT: z.number().int().min(1000).max(65535),
    LOGGING: z.object({
      ROLLBAR_SERVER_TOKEN: z.string(),
      ROLLBAR_ENV: z.string(),
      TEST_WITHOUT_LOGS: z.boolean(),
    }),
  }),
);
