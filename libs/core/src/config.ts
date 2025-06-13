import { createHash } from 'crypto';
import * as dotenv from 'dotenv';
import _ from 'lodash';
import { ZodType, z } from 'zod/v4';
import { LogLevel, LogLevels } from './ports/enums';

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
] as const;
type Environment = (typeof Environments)[number];
type AppEnvironment = (typeof AppEnvironments)[number];

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// Merge function that throws on key value conflict
function customMerge(objValue: unknown, srcValue: unknown, key: unknown) {
  // If both values are plain objects, let mergeWith handle merging recursively.
  if (_.isPlainObject(objValue) && _.isPlainObject(srcValue)) {
    return undefined; // Use default merge behavior.
  }
  // If the key exists and the values differ, throw an error.
  if (objValue !== undefined && objValue !== srcValue) {
    throw new Error(`Conflict detected at key "${key}"`);
  }
  // Otherwise, use the source value.
  return srcValue;
}

/**
 * Extends target config with payload after validating schema
 *
 * @param targets array of parsed payloads to include in the extended config
 * @param extend extended payload
 * @param schema extended schema
 * @returns extended config
 */
export const configure = <
  T extends Record<string, unknown>[],
  E extends Record<string, unknown>,
>(
  targets: [...Readonly<T>],
  extend: Readonly<E>,
  schema: ZodType<E>,
): Readonly<UnionToIntersection<T[number]> & E> => {
  // First merge all target objects together
  const mergedTargets = _.merge({}, ...targets);
  // Then validate extend with schema and merge it with the merged targets
  const validatedExtend = schema.parse(extend);
  return _.mergeWith(mergedTargets, validatedExtend, customMerge) as Readonly<
    UnionToIntersection<T[number]> & E
  >;
};

const {
  APP_ENV,
  APP_ENV_PASSWORD,
  MAGIC_API_KEY,
  MAGIC_CLIENT_ID,
  NODE_ENV,
  IS_CI,
  SERVER_URL,
  PORT: _PORT,
  LOG_LEVEL,
  ROLLBAR_SERVER_TOKEN: _ROLLBAR_SERVER_TOKEN,
  ROLLBAR_ENV: _ROLLBAR_ENV,
  TEST_WITHOUT_LOGS,
  HEROKU_APP_NAME,
  HEROKU_API_TOKEN,
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
  [{}],
  {
    APP_ENV: APP_ENV as AppEnvironment,
    APP_ENV_PASSWORD: APP_ENV_PASSWORD,
    MAGIC_API_KEY,
    MAGIC_CLIENT_ID,
    NODE_ENV: (NODE_ENV || DEFAULTS.NODE_ENV) as Environment,
    IS_CI: IS_CI === 'true',
    SERVER_URL: SERVER_URL ?? DEFAULTS.SERVER_URL,
    PORT: _PORT ? parseInt(_PORT, 10) : DEFAULTS.PORT,
    HEROKU: {
      HEROKU_APP_NAME,
      HEROKU_API_TOKEN,
    },
    LOGGING: {
      LOG_LEVEL:
        (LOG_LEVEL as LogLevel) ||
        (NODE_ENV === 'production' ? 'info' : 'debug'),
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
    }, 'APP_ENV_PASSWORD must be correct to set APP_ENV to production.'),
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
        'SERVER_URL cannot be set to a default value in non-local or CI environments (i.e. Heroku apps).',
      ),
    PORT: z.number().int().min(1000).max(65535),
    MAGIC_API_KEY: z
      .string()
      .optional()
      .refine(
        (data) => !(APP_ENV === 'production' && !data),
        'MAGIC_API_KEY is required in production',
      ),
    MAGIC_CLIENT_ID: z
      .string()
      .optional()
      .refine(
        (data) => !(APP_ENV === 'production' && !data),
        'MAGIC_CLIENT_ID is required in production',
      ),
    HEROKU: z.object({
      HEROKU_APP_NAME: z.string().optional(),
      HEROKU_API_TOKEN: z.string().optional(),
    }),
    LOGGING: z
      .object({
        LOG_LEVEL: z
          .enum(LogLevels)
          .refine((data) => !(APP_ENV === 'production' && data !== 'info')),
        ROLLBAR_SERVER_TOKEN: z.string(),
        ROLLBAR_ENV: z.string(),
        TEST_WITHOUT_LOGS: z.boolean(),
      })
      .refine((data) => {
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
      }, 'ROLLBAR_SERVER_TOKEN and ROLLBAR_ENV may only be set in production to a non-default value.'),
  }),
);
