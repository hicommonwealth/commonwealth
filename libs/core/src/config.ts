import { Environments } from '@hicommonwealth/schemas';
import { createHash } from 'crypto';
import * as dotenv from 'dotenv';
import _ from 'lodash';
import { ZodType, z } from 'zod';
import { LogLevel, LogLevels } from './ports/enums';

dotenv.config({ path: '../../.env' });

const APP_ENV_PASSWORD_HASH =
  '7f5c0fe24e27b24fcab364f319e488fffe99104b8f82bec64b6bc82c3a729090';

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
export const DeployedEnvironments = [
  'production',
  'beta',
  'frick',
  'demo',
  'frack',
] as const satisfies AppEnvironment[];
export const ProdLikeEnvironments = [
  'production',
  'beta',
  'frick',
  'demo',
] as const satisfies AppEnvironment[];
export const ProductionEnvironments = [
  'production',
  'beta',
  'demo',
] as const satisfies AppEnvironment[];
const Services = [
  'web',
  'consumer',
  'message-relayer',
  'graphile',
  'discord-listener',
  'twitter',
  'knock',
  'evm-ce',
  'web-modulith',
  // TODO: add modulith web service and update all requiredInEnvironmentServices uses to include it as needed
] as const;
export const WebServices = ['web', 'web-modulith'] as const satisfies Service[];
type Service = (typeof Services)[number];

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

export function isAllDefined(...args: unknown[]): true | undefined {
  const res = args.every(
    (arg) => arg !== undefined && arg !== null && arg !== '',
  );
  if (!res) return undefined;
  return true;
}

export function requiredInEnvironmentServices<T>({
  // TODO: disAllowedEnvs and disAllowedServices
  config,
  requiredAppEnvs,
  requiredServices,
  defaultCheck,
  mustBeUndefined,
}: {
  config: { APP_ENV: AppEnvironment; SERVICE: Service; DEV_MODULITH: boolean };
  requiredAppEnvs: AppEnvironment[] | 'all';
  requiredServices:
    | ['web', 'web-modulith', ...Service[]]
    | Exclude<Service, 'web'>[]
    | 'all';
} & (
  | {
      mustBeUndefined?: boolean;
      defaultCheck?: never;
    }
  | { mustBeUndefined?: never; defaultCheck?: T }
)) {
  const { APP_ENV: appEnv, SERVICE, DEV_MODULITH } = config;
  // DEV_MODULITH overrides SERVICE - needed when using modulith on Railway
  // This works on the client because there is a single .env (all env var loaded for every service)
  // This works for Railway because there is a separate set of env vars for each service
  const service = DEV_MODULITH && SERVICE === 'web' ? 'web-modulith' : SERVICE;

  return (data: T | undefined) => {
    // Ensures data is not set to default value in specified environments/services
    if (defaultCheck) {
      if (defaultCheck !== data) return true;
    }
    // Ensures data is undefined in specified environments/services
    else if (mustBeUndefined) {
      if (data === undefined) return true;
    }
    // Ensures data is not undefined in specified environments/services
    else if (data !== undefined) return true;

    if (!requiredAppEnvs.length || !requiredServices.length) return true;
    if (requiredAppEnvs === 'all') return false;
    if (!requiredAppEnvs.includes(appEnv)) return true;
    if (requiredServices === 'all') return false;
    return !requiredServices.includes(service as Exclude<Service, 'web'>);
  };
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
  SERVICE,
  MAGIC_API_KEY,
  MAGIC_PUBLISHABLE_KEY,
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
  MIXPANEL_TOKEN,
  DEV_MODULITH,
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
    SERVICE: SERVICE as Service,
    MAGIC_API_KEY,
    MAGIC_PUBLISHABLE_KEY: MAGIC_PUBLISHABLE_KEY || 'pk_live_EF89AABAFB87D6F4',
    MAGIC_CLIENT_ID,
    NODE_ENV: (NODE_ENV || DEFAULTS.NODE_ENV) as Environment,
    DEV_MODULITH: DEV_MODULITH === 'true',
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
    ANALYTICS: {
      MIXPANEL_TOKEN: MIXPANEL_TOKEN || '312b6c5fadb9a88d98dc1fb38de5d900',
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
      .refine(
        requiredInEnvironmentServices({
          config: {
            APP_ENV: APP_ENV as AppEnvironment,
            SERVICE: SERVICE as Service,
            DEV_MODULITH: DEV_MODULITH === 'true',
          },
          requiredAppEnvs: ['production'],
          requiredServices: 'all',
        }),
      ),
    SERVICE: z.enum(Services),
    NODE_ENV: z.enum(Environments),
    DEV_MODULITH: z.boolean(),
    IS_CI: z.boolean(),
    SERVER_URL: z.string().refine(
      requiredInEnvironmentServices({
        config: {
          APP_ENV: APP_ENV as AppEnvironment,
          SERVICE: SERVICE as Service,
          DEV_MODULITH: DEV_MODULITH === 'true',
        },

        requiredAppEnvs: ['frick', 'frack', 'beta', 'demo', 'production'],
        requiredServices: 'all',
        defaultCheck: DEFAULTS.SERVER_URL,
      }),
    ),
    PORT: z.number().int().min(1000).max(65535),
    MAGIC_API_KEY: z
      .string()
      .optional()
      .refine(
        requiredInEnvironmentServices({
          config: {
            APP_ENV: APP_ENV as AppEnvironment,
            SERVICE: SERVICE as Service,
            DEV_MODULITH: DEV_MODULITH === 'true',
          },
          requiredAppEnvs: ['production', 'beta', 'frick', 'demo'],
          requiredServices: WebServices,
        }),
      ),
    MAGIC_PUBLISHABLE_KEY: z.string(),
    MAGIC_CLIENT_ID: z
      .string()
      .optional()
      .refine(
        requiredInEnvironmentServices({
          config: {
            APP_ENV: APP_ENV as AppEnvironment,
            SERVICE: SERVICE as Service,
            DEV_MODULITH: DEV_MODULITH === 'true',
          },
          requiredAppEnvs: ['production', 'beta', 'frick', 'demo'],
          requiredServices: WebServices,
        }),
      ),
    HEROKU: z.object({
      HEROKU_APP_NAME: z.string().optional(),
      HEROKU_API_TOKEN: z.string().optional(),
    }),
    LOGGING: z
      .object({
        LOG_LEVEL: z
          .enum(LogLevels)
          .refine(
            (data) => !(APP_ENV === 'production' && data !== 'info'),
            'LOG_LEVEL must be info in production.',
          ),
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
    ANALYTICS: z.object({
      MIXPANEL_TOKEN: z.string(),
    }),
  }),
);
