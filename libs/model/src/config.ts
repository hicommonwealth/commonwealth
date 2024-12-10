import { configure, config as target } from '@hicommonwealth/core';
import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';
import { z } from 'zod';

const {
  DATABASE_URL,
  DATABASE_CLEAN_HOUR,
  DATABASE_LOG_TRACE,
  DEFAULT_COMMONWEALTH_LOGO,
  DISCORD_CLIENT_ID,
  DISCORD_TOKEN,
  NO_SSL,
  PRIVATE_KEY,
  TBC_BALANCE_TTL_SECONDS,
  BLACKLISTED_EVENTS,
  MAX_USER_POSTS_PER_CONTEST,
  JWT_SECRET,
  ADDRESS_TOKEN_EXPIRES_IN,
  ALCHEMY_BASE_WEBHOOK_SIGNING_KEY,
  ALCHEMY_BASE_SEPOLIA_WEBHOOK_SIGNING_KEY,
  ALCHEMY_ETH_SEPOLIA_WEBHOOK_SIGNING_KEY,
  ALCHEMY_AA_PRIVATE_KEY,
  ALCHEMY_AA_KEY,
  ALCHEMY_AA_GAS_POLICY,
  FLAG_COMMON_WALLET,
  SITEMAP_THREAD_PRIORITY,
  SITEMAP_PROFILE_PRIORITY,
  PROVIDER_URL,
  ETH_RPC,
  COSMOS_REGISTRY_API,
  REACTION_WEIGHT_OVERRIDE,
  ALCHEMY_PRIVATE_APP_KEY,
  ALCHEMY_PUBLIC_APP_KEY,
  MEMBERSHIP_REFRESH_BATCH_SIZE,
  MEMBERSHIP_REFRESH_TTL_SECONDS,
  NEYNAR_API_KEY,
  NEYNAR_CAST_CREATED_WEBHOOK_SECRET,
  NEYNAR_REPLY_WEBHOOK_URL,
  FARCASTER_ACTION_URL,
  FLAG_FARCASTER_CONTEST,
  OPENAI_API_KEY,
  OPENAI_ORGANIZATION,
} = process.env;

const NAME = target.NODE_ENV === 'test' ? 'common_test' : 'commonwealth';

const DEFAULTS = {
  JWT_SECRET: 'my secret',
  ADDRESS_TOKEN_EXPIRES_IN: '10',
  PRIVATE_KEY: '',
  DATABASE_URL: `postgresql://commonwealth:edgeware@localhost/${NAME}`,
  DEFAULT_COMMONWEALTH_LOGO: `https://s3.amazonaws.com/${S3_ASSET_BUCKET_CDN}/common-white.png`,
  MEMBERSHIP_REFRESH_BATCH_SIZE: '1000',
  MEMBERSHIP_REFRESH_TTL_SECONDS: '120',
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
      BLACKLISTED_EVENTS: BLACKLISTED_EVENTS
        ? BLACKLISTED_EVENTS.split(',')
        : [],
    },
    STAKE: {
      REACTION_WEIGHT_OVERRIDE: REACTION_WEIGHT_OVERRIDE
        ? parseInt(REACTION_WEIGHT_OVERRIDE, 10)
        : null,
    },
    CONTESTS: {
      MIN_USER_ETH: 0,
      MAX_USER_POSTS_PER_CONTEST: MAX_USER_POSTS_PER_CONTEST
        ? parseInt(MAX_USER_POSTS_PER_CONTEST, 10)
        : 5,
      FLAG_FARCASTER_CONTEST: FLAG_FARCASTER_CONTEST === 'true',
      NEYNAR_API_KEY: NEYNAR_API_KEY,
      NEYNAR_CAST_CREATED_WEBHOOK_SECRET: NEYNAR_CAST_CREATED_WEBHOOK_SECRET,
      NEYNAR_REPLY_WEBHOOK_URL: NEYNAR_REPLY_WEBHOOK_URL,
      FARCASTER_ACTION_URL: FARCASTER_ACTION_URL,
    },
    AUTH: {
      JWT_SECRET: JWT_SECRET || DEFAULTS.JWT_SECRET,
      SESSION_EXPIRY_MILLIS: 30 * 24 * 60 * 60 * 1000,
      ADDRESS_TOKEN_EXPIRES_IN: parseInt(
        ADDRESS_TOKEN_EXPIRES_IN ?? DEFAULTS.ADDRESS_TOKEN_EXPIRES_IN,
        10,
      ),
    },
    ALCHEMY: {
      BASE_WEBHOOK_SIGNING_KEY: ALCHEMY_BASE_WEBHOOK_SIGNING_KEY,
      BASE_SEPOLIA_WEBHOOK_SIGNING_KEY:
        ALCHEMY_BASE_SEPOLIA_WEBHOOK_SIGNING_KEY,
      ETH_SEPOLIA_WEBHOOOK_SIGNING_KEY: ALCHEMY_ETH_SEPOLIA_WEBHOOK_SIGNING_KEY,
      AA: {
        FLAG_COMMON_WALLET: FLAG_COMMON_WALLET === 'true',
        ALCHEMY_KEY: ALCHEMY_AA_KEY,
        PRIVATE_KEY: ALCHEMY_AA_PRIVATE_KEY,
        GAS_POLICY: ALCHEMY_AA_GAS_POLICY,
      },
      APP_KEYS: {
        PRIVATE: ALCHEMY_PRIVATE_APP_KEY!,
        PUBLIC: ALCHEMY_PUBLIC_APP_KEY!,
      },
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
    TEST_EVM: {
      ETH_RPC: ETH_RPC || 'prod',
      // URL of the local Ganache, Anvil, or Hardhat chain
      PROVIDER_URL: PROVIDER_URL ?? 'http://127.0.0.1:8545',
    },
    COSMOS: {
      COSMOS_REGISTRY_API:
        COSMOS_REGISTRY_API || 'https://cosmoschains.thesilverfox.pro',
    },
    MEMBERSHIP_REFRESH_BATCH_SIZE: parseInt(
      MEMBERSHIP_REFRESH_BATCH_SIZE ?? DEFAULTS.MEMBERSHIP_REFRESH_BATCH_SIZE,
      10,
    ),
    MEMBERSHIP_REFRESH_TTL_SECONDS: parseInt(
      MEMBERSHIP_REFRESH_TTL_SECONDS ?? DEFAULTS.MEMBERSHIP_REFRESH_TTL_SECONDS,
      10,
    ),
    DISCORD: {
      CLIENT_ID: DISCORD_CLIENT_ID,
      BOT_TOKEN: DISCORD_TOKEN,
    },
    OPENAI: {
      API_KEY: OPENAI_API_KEY,
      ORGANIZATION: OPENAI_ORGANIZATION || 'org-D0ty00TJDApqHYlrn1gge2Ql',
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
      BLACKLISTED_EVENTS: z.array(z.string()),
    }),
    STAKE: z.object({
      REACTION_WEIGHT_OVERRIDE: z.number().int().nullish(),
    }),
    CONTESTS: z.object({
      MIN_USER_ETH: z.number(),
      MAX_USER_POSTS_PER_CONTEST: z.number().int(),
      FLAG_FARCASTER_CONTEST: z.boolean().nullish(),
      NEYNAR_API_KEY: z.string().nullish(),
      NEYNAR_CAST_CREATED_WEBHOOK_SECRET: z.string().nullish(),
      NEYNAR_REPLY_WEBHOOK_URL: z.string().nullish(),
      FARCASTER_ACTION_URL: z.string().nullish(),
    }),
    AUTH: z
      .object({
        JWT_SECRET: z.string(),
        SESSION_EXPIRY_MILLIS: z.number().int(),
        ADDRESS_TOKEN_EXPIRES_IN: z.number().int(),
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
      AA: z
        .object({
          FLAG_COMMON_WALLET: z.boolean().optional(),
          PRIVATE_KEY: z.string().optional(),
          ALCHEMY_KEY: z.string().optional(),
          GAS_POLICY: z.string().optional(),
        })
        .refine((data) => {
          if (data.FLAG_COMMON_WALLET && target.APP_ENV === 'production')
            return data.PRIVATE_KEY && data.ALCHEMY_KEY && data.GAS_POLICY;
          return true;
        }),
      APP_KEYS: z.object({
        PRIVATE: z.string(),
        PUBLIC: z.string(),
      }),
    }),
    SITEMAP: z.object({
      THREAD_PRIORITY: z.coerce.number(),
      PROFILE_PRIORITY: z.coerce.number(),
    }),
    DEFAULT_COMMONWEALTH_LOGO: z.string().url(),
    TEST_EVM: z.object({
      ETH_RPC: z.string(),
      PROVIDER_URL: z.string(),
    }),
    COSMOS: z.object({
      COSMOS_REGISTRY_API: z.string(),
    }),
    MEMBERSHIP_REFRESH_BATCH_SIZE: z.number().int().positive(),
    MEMBERSHIP_REFRESH_TTL_SECONDS: z.number().int().positive(),
    DISCORD: z.object({
      CLIENT_ID: z
        .string()
        .optional()
        .refine(
          (data) =>
            !(
              ['production', 'frick', 'beta', 'demo'].includes(
                target.APP_ENV,
              ) && !data
            ),
          'DISCORD_CLIENT_ID is required in production, frick, beta (QA), and demo',
        ),
      BOT_TOKEN: z
        .string()
        .optional()
        .refine(
          (data) =>
            !(
              ['production', 'frick', 'frack', 'beta', 'demo'].includes(
                target.APP_ENV,
              ) && !data
            ),
          'DISCORD_TOKEN is required in production, frick, frack, beta (QA), and demo',
        ),
    }),
    OPENAI: z.object({
      API_KEY: z.string().optional(),
      ORGANIZATION: z.string().optional(),
    }),
  }),
);
