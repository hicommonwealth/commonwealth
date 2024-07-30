import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const {
  TEST_DB_NAME,
  DATABASE_URL,
  DATABASE_CLEAN_HOUR,
  DATABASE_LOG_TRACE,
  NO_SSL,
  PRIVATE_KEY,
  TBC_BALANCE_TTL_SECONDS,
  ALLOWED_EVENTS,
  INIT_TEST_DB,
  MAX_USER_POSTS_PER_CONTEST,
  JWT_SECRET,
  ALCHEMY_BASE_WEBHOOK_SIGNING_KEY,
  ALCHEMY_BASE_SEPOLIA_WEBHOOK_SIGNING_KEY,
  ALCHEMY_ETH_SEPOLIA_WEBHOOK_SIGNING_KEY,
} = process.env;

const NAME =
  target.NODE_ENV === 'test' ? TEST_DB_NAME || 'common_test' : 'commonwealth';

const DEFAULTS = {
  JWT_SECRET: 'my secret',
  PRIVATE_KEY: '',
  DATABASE_URL: `postgresql://commonwealth:edgeware@localhost/${NAME}`,
};

export const config = configure(
  target,
  {
    DB: {
      URI: DATABASE_URL ?? DEFAULTS.DATABASE_URL,
      NAME,
      NO_SSL: NO_SSL === 'true',
      CLEAN_HOUR: DATABASE_CLEAN_HOUR
        ? parseInt(DATABASE_CLEAN_HOUR, 10)
        : undefined,
      INIT_TEST_DB: INIT_TEST_DB === 'true',
      TRACE: DATABASE_LOG_TRACE === 'true',
    },
    WEB3: {
      PRIVATE_KEY: PRIVATE_KEY || '',
    },
    TBC: {
      TTL_SECS: TBC_BALANCE_TTL_SECONDS
        ? parseInt(TBC_BALANCE_TTL_SECONDS, 10)
        : 300,
    },
    OUTBOX: {
      ALLOWED_EVENTS: ALLOWED_EVENTS ? ALLOWED_EVENTS.split(',') : [],
    },
    CONTESTS: {
      MIN_USER_ETH: 0.0005,
      MAX_USER_POSTS_PER_CONTEST: MAX_USER_POSTS_PER_CONTEST
        ? parseInt(MAX_USER_POSTS_PER_CONTEST, 10)
        : 2,
    },
    AUTH: {
      JWT_SECRET: JWT_SECRET || DEFAULTS.JWT_SECRET,
      SESSION_EXPIRY_MILLIS: 30 * 24 * 60 * 60 * 1000,
    },
    ALCHEMY: {
      BASE_WEBHOOK_SIGNING_KEY: ALCHEMY_BASE_WEBHOOK_SIGNING_KEY,
      BASE_SEPOLIA_WEBHOOK_SIGNING_KEY:
        ALCHEMY_BASE_SEPOLIA_WEBHOOK_SIGNING_KEY,
      ETH_SEPOLIA_WEBHOOOK_SIGNING_KEY: ALCHEMY_ETH_SEPOLIA_WEBHOOK_SIGNING_KEY,
    },
  },
  z.object({
    DB: z.object({
      URI: z
        .string()
        .refine(
          (data) =>
            !(
              target.APP_ENV !== 'local' &&
              target.APP_ENV !== 'CI' &&
              data === DEFAULTS.DATABASE_URL
            ),
          'DATABASE_URL must be set to a non-default value in Heroku apps.',
        ),
      NAME: z.string(),
      NO_SSL: z.boolean(),
      CLEAN_HOUR: z.coerce.number().int().min(0).max(24).optional(),
      INIT_TEST_DB: z.boolean(),
      TRACE: z.boolean(),
    }),
    WEB3: z.object({
      PRIVATE_KEY: z
        .string()
        .refine(
          (data) =>
            !(target.APP_ENV === 'production' && data === DEFAULTS.PRIVATE_KEY),
          'PRIVATE_KEY must be set to a non-default value in production.',
        ),
    }),
    TBC: z.object({
      TTL_SECS: z.number().int(),
    }),
    OUTBOX: z.object({
      ALLOWED_EVENTS: z.array(z.string()),
    }),
    CONTESTS: z.object({
      MIN_USER_ETH: z.number(),
      MAX_USER_POSTS_PER_CONTEST: z.number().int(),
    }),
    AUTH: z
      .object({
        JWT_SECRET: z.string(),
        SESSION_EXPIRY_MILLIS: z.number().int(),
      })
      .refine(
        (data) => {
          if (!['local', 'CI'].includes(target.APP_ENV)) {
            return !!JWT_SECRET && data.JWT_SECRET !== DEFAULTS.JWT_SECRET;
          }
          return true;
        },
        {
          message:
            'JWT_SECRET must be set to a non-default value in production environments',
          path: ['JWT_SECRET'],
        },
      ),
    ALCHEMY: z.object({
      BASE_WEBHOOK_SIGNING_KEY: z.string().optional(),
      BASE_SEPOLIA_WEBHOOK_SIGNING_KEY: z.string().optional(),
      ETH_SEPOLIA_WEBHOOOK_SIGNING_KEY: z.string().optional(),
    }), // TODO: make these mandatory in production before chain-event v3 (Alchemy Webhooks) goes live
  }),
);
