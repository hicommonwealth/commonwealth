import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const {
  ENFORCE_SESSION_KEYS,
  TEST_DB_NAME,
  DATABASE_URL,
  DATABASE_CLEAN_HOUR,
  DATABASE_LOG_TRACE,
  DEFAULT_COMMONWEALTH_LOGO,
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
  SITEMAP_THREAD_PRIORITY,
  SITEMAP_PROFILE_PRIORITY,
  ETH_ALCHEMY_API_KEY,
  PROVIDER_URL,
  ETH_RPC,
  COSMOS_REGISTRY_API,
} = process.env;

const NAME =
  target.NODE_ENV === 'test' ? TEST_DB_NAME || 'common_test' : 'commonwealth';

const DEFAULTS = {
  JWT_SECRET: 'my secret',
  PRIVATE_KEY: '',
  DATABASE_URL: `postgresql://commonwealth:edgeware@localhost/${NAME}`,
  DEFAULT_COMMONWEALTH_LOGO:
    'https://s3.amazonaws.com/assets.commonwealth.im/common-white.png',
};

export const config = configure(
  target,
  {
    ENFORCE_SESSION_KEYS: ENFORCE_SESSION_KEYS === 'true',
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
    SITEMAP: {
      THREAD_PRIORITY: SITEMAP_THREAD_PRIORITY
        ? parseInt(SITEMAP_THREAD_PRIORITY)
        : 0.8,
      PROFILE_PRIORITY: SITEMAP_PROFILE_PRIORITY
        ? parseInt(SITEMAP_PROFILE_PRIORITY)
        : -1,
    },
    DEFAULT_COMMONWEALTH_LOGO:
      DEFAULT_COMMONWEALTH_LOGO ?? DEFAULTS.DEFAULT_COMMONWEALTH_LOGO,
    EVM: {
      ETH_RPC: ETH_RPC || 'prod',
      // URL of the local Ganache, Anvil, or Hardhat chain
      PROVIDER_URL: PROVIDER_URL ?? 'http://127.0.0.1:8545',
      ETH_ALCHEMY_API_KEY,
    },
    COSMOS: {
      COSMOS_REGISTRY_API:
        COSMOS_REGISTRY_API || 'https://cosmoschains.thesilverfox.pro',
    },
  },
  z.object({
    ENFORCE_SESSION_KEYS: z.boolean(),
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
    SITEMAP: z.object({
      THREAD_PRIORITY: z.coerce.number(),
      PROFILE_PRIORITY: z.coerce.number(),
    }),
    DEFAULT_COMMONWEALTH_LOGO: z.string().url(),
    EVM: z.object({
      ETH_RPC: z.string(),
      PROVIDER_URL: z.string(),
      ETH_ALCHEMY_API_KEY: z.string().optional(),
      BASESEP_ALCHEMY_API_KEY: z.string().optional(),
    }),
    COSMOS: z.object({
      COSMOS_REGISTRY_API: z.string(),
    }),
  }),
);
