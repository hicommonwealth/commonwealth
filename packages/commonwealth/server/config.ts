import { config as adapters_config } from '@hicommonwealth/adapters';
import { configure } from '@hicommonwealth/core';
import { config as model_config } from '@hicommonwealth/model';
import { ChainBase } from '@hicommonwealth/shared';
import { z } from 'zod';

const {
  SENDGRID_API_KEY,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_TOKEN_DEV,
  SESSION_SECRET,
  NO_PRERENDER: _NO_PRERENDER,
  NO_GLOBAL_ACTIVITY_CACHE,
  PRERENDER_TOKEN,
  GENERATE_IMAGE_RATE_LIMIT,
  MAGIC_SUPPORTED_BASES,
  MAGIC_DEFAULT_CHAIN,
  ADDRESS_TOKEN_EXPIRES_IN,

  DISCORD_CLIENT_ID,
  DISCORD_TOKEN,
  CW_BOT_KEY,
  ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS,
  MESSAGE_RELAYER_TIMEOUT_MS,
  MESSAGE_RELAYER_PREFETCH,
  EVM_CE_POLL_INTERVAL,
  CF_ZONE_ID,
  CF_API_KEY,
  PEER_ID,
} = process.env;

const NO_PRERENDER = _NO_PRERENDER;

const DEFAULTS = {
  GENERATE_IMAGE_RATE_LIMIT: '10',
  ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS: '60',
  SESSION_SECRET: 'my secret',
  MAGIC_SUPPORTED_BASES: [ChainBase.Ethereum],
  MAGIC_DEFAULT_CHAIN: ChainBase.Ethereum,
  ADDRESS_TOKEN_EXPIRES_IN: '10',
  MESSAGE_RELAYER_TIMEOUT_MS: '200',
  MESSAGE_RELAYER_PREFETCH: '50',
  EVM_CE_POLL_INTERVAL: '120000',
};

export const config = configure(
  { ...model_config, ...adapters_config },
  {
    NO_PRERENDER: NO_PRERENDER === 'true',
    NO_GLOBAL_ACTIVITY_CACHE: NO_GLOBAL_ACTIVITY_CACHE === 'true',
    PRERENDER_TOKEN,
    GENERATE_IMAGE_RATE_LIMIT: parseInt(
      GENERATE_IMAGE_RATE_LIMIT ?? DEFAULTS.GENERATE_IMAGE_RATE_LIMIT,
      10,
    ),
    CW_BOT_KEY,
    ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS: parseInt(
      ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS ??
        DEFAULTS.ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS,
      10,
    ),
    AUTH: {
      SESSION_SECRET: SESSION_SECRET || DEFAULTS.SESSION_SECRET,
      MAGIC_SUPPORTED_BASES:
        (MAGIC_SUPPORTED_BASES?.split(',') as ChainBase[]) ||
        DEFAULTS.MAGIC_SUPPORTED_BASES,
      MAGIC_DEFAULT_CHAIN:
        (MAGIC_DEFAULT_CHAIN as ChainBase) ?? DEFAULTS.MAGIC_DEFAULT_CHAIN,
      ADDRESS_TOKEN_EXPIRES_IN: parseInt(
        ADDRESS_TOKEN_EXPIRES_IN ?? DEFAULTS.ADDRESS_TOKEN_EXPIRES_IN,
        10,
      ),
    },
    SENDGRID: {
      API_KEY: SENDGRID_API_KEY,
    },
    TELEGRAM: {
      BOT_TOKEN:
        model_config.APP_ENV === 'production'
          ? TELEGRAM_BOT_TOKEN
          : TELEGRAM_BOT_TOKEN_DEV,
    },
    DISCORD: {
      CLIENT_ID: DISCORD_CLIENT_ID,
      BOT_TOKEN: DISCORD_TOKEN,
    },
    CLOUDFLARE: {
      ZONE_ID: CF_ZONE_ID,
      API_KEY: CF_API_KEY,
    },
    WORKERS: {
      /*
       * NOTE: (1000 / MESSAGE_RELAYER_TIMEOUT_MS) * MESSAGE_RELAYER_PREFETCH = the upperbound
       * number of Outbox events (records) that can be processed per second.
       * Defaults to 1000 events per second.
       * This calculation does not account for the time it takes for messages to be
       * fetched + published (hence upperbound assuming fetching + publishing takes 0ms).
       */
      MESSAGE_RELAYER_TIMEOUT_MS: parseInt(
        MESSAGE_RELAYER_TIMEOUT_MS ?? DEFAULTS.MESSAGE_RELAYER_TIMEOUT_MS,
        10,
      ),
      MESSAGE_RELAYER_PREFETCH: parseInt(
        MESSAGE_RELAYER_PREFETCH ?? DEFAULTS.MESSAGE_RELAYER_PREFETCH,
        10,
      ),
      EVM_CE_POLL_INTERVAL_MS: parseInt(
        EVM_CE_POLL_INTERVAL ?? DEFAULTS.EVM_CE_POLL_INTERVAL,
        10,
      ),
    },
    PEER_ID,
  },
  z.object({
    NO_PRERENDER: z.boolean(),
    NO_GLOBAL_ACTIVITY_CACHE: z.boolean(),
    PRERENDER_TOKEN: z.string().optional(),
    GENERATE_IMAGE_RATE_LIMIT: z.number().int().positive(),
    CW_BOT_KEY: z
      .string()
      .optional()
      .refine(
        (data) =>
          !(
            ['frick', 'production', 'beta', 'demo'].includes(
              model_config.APP_ENV,
            ) && !data
          ),
        'CW_BOT_KEY is required in frick, production, beta (QA), and demo',
      ),
    ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS: z.number().int().positive(),
    AUTH: z.object({
      SESSION_SECRET: z
        .string()
        .refine(
          (data) =>
            !(
              model_config.APP_ENV === 'production' &&
              data === DEFAULTS.SESSION_SECRET
            ),
          'SESSION_SECRET must be a non-default value in production',
        ),
      MAGIC_SUPPORTED_BASES: z.array(z.nativeEnum(ChainBase)),
      MAGIC_DEFAULT_CHAIN: z.nativeEnum(ChainBase),
      ADDRESS_TOKEN_EXPIRES_IN: z.number().int(),
    }),
    SENDGRID: z.object({
      API_KEY: z
        .string()
        .optional()
        .refine(
          (data) => !(model_config.APP_ENV === 'production' && !data),
          'SENDGRID_API_KEY is required in production',
        ),
    }),
    TELEGRAM: z.object({
      BOT_TOKEN: z
        .string()
        .optional()
        .refine(
          (data) => !(model_config.APP_ENV === 'production' && !data),
          'TELEGRAM_BOT_TOKEN is required in production',
        ),
    }),
    DISCORD: z.object({
      CLIENT_ID: z
        .string()
        .optional()
        .refine(
          (data) =>
            !(
              ['production', 'frick', 'beta', 'demo'].includes(
                model_config.APP_ENV,
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
              ['production', 'frick', 'beta', 'demo'].includes(
                model_config.APP_ENV,
              ) && !data
            ),
          'DISCORD_TOKEN is required in production, frick, beta (QA), and demo',
        ),
    }),
    CLOUDFLARE: z.object({
      ZONE_ID: z
        .string()
        .optional()
        .refine(
          (data) => !(['production'].includes(model_config.APP_ENV) && !data),
          'CF_ZONE_ID is required in production',
        ),
      API_KEY: z
        .string()
        .optional()
        .refine(
          (data) => !(['production'].includes(model_config.APP_ENV) && !data),
          'CF_API_KEY is required in production',
        ),
    }),
    WORKERS: z.object({
      MESSAGE_RELAYER_TIMEOUT_MS: z.number().int().positive(),
      MESSAGE_RELAYER_PREFETCH: z.number().int().positive(),
      EVM_CE_POLL_INTERVAL_MS: z.number().int().positive(),
    }),
    PEER_ID: z.string().optional(),
  }),
);
