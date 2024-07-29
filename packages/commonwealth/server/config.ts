import { config as adapters_config } from '@hicommonwealth/adapters';
import { configure } from '@hicommonwealth/core';
import { config as evm_config } from '@hicommonwealth/evm-testing';
import { config as model_config } from '@hicommonwealth/model';
import { ChainBase } from '@hicommonwealth/shared';
import { z } from 'zod';

const {
  ENFORCE_SESSION_KEYS,
  SENDGRID_API_KEY,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_TOKEN_DEV,
  SESSION_SECRET,
  SEND_EMAILS: _SEND_EMAILS,
  SEND_WEBHOOKS_EMAILS,
  NO_PRERENDER: _NO_PRERENDER,
  NO_GLOBAL_ACTIVITY_CACHE,
  PRERENDER_TOKEN,
  GENERATE_IMAGE_RATE_LIMIT,
  MAGIC_API_KEY,
  MAGIC_SUPPORTED_BASES,
  MAGIC_DEFAULT_CHAIN,
  ADDRESS_TOKEN_EXPIRES_IN,
  DEFAULT_COMMONWEALTH_LOGO,
  MEMBERSHIP_REFRESH_BATCH_SIZE,
  MEMBERSHIP_REFRESH_TTL_SECONDS,
  DISCORD_CLIENT_ID,
  DISCORD_BOT_TOKEN,
  REACTION_WEIGHT_OVERRIDE,
  CW_BOT_KEY,
  ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS,
  MESSAGE_RELAYER_TIMEOUT_MS,
  MESSAGE_RELAYER_PREFETCH,
  EVM_CE_POLL_INTERVAL,
} = process.env;

const SEND_EMAILS = _SEND_EMAILS === 'true';
const NO_PRERENDER = _NO_PRERENDER;

const DEFAULTS = {
  GENERATE_IMAGE_RATE_LIMIT: '10',
  DEFAULT_COMMONWEALTH_LOGO:
    'https://commonwealth.im/static/brand_assets/logo_stacked.png',
  MEMBERSHIP_REFRESH_BATCH_SIZE: '1000',
  MEMBERSHIP_REFRESH_TTL_SECONDS: '120',
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
  { ...model_config, ...adapters_config, ...evm_config },
  {
    ENFORCE_SESSION_KEYS: ENFORCE_SESSION_KEYS === 'true',
    SEND_EMAILS,
    // Should be false EVERYWHERE except the production `commonwealthapp` Heroku app
    // Risks sending webhooks/emails to real users if incorrectly set to true
    SEND_WEBHOOKS_EMAILS:
      model_config.APP_ENV === 'production' && SEND_WEBHOOKS_EMAILS === 'true',
    NO_PRERENDER: NO_PRERENDER === 'true',
    NO_GLOBAL_ACTIVITY_CACHE: NO_GLOBAL_ACTIVITY_CACHE === 'true',
    PRERENDER_TOKEN,
    GENERATE_IMAGE_RATE_LIMIT: parseInt(
      GENERATE_IMAGE_RATE_LIMIT ?? DEFAULTS.GENERATE_IMAGE_RATE_LIMIT,
      10,
    ),
    DEFAULT_COMMONWEALTH_LOGO:
      DEFAULT_COMMONWEALTH_LOGO ?? DEFAULTS.DEFAULT_COMMONWEALTH_LOGO,
    MEMBERSHIP_REFRESH_BATCH_SIZE: parseInt(
      MEMBERSHIP_REFRESH_BATCH_SIZE ?? DEFAULTS.MEMBERSHIP_REFRESH_BATCH_SIZE,
      10,
    ),
    MEMBERSHIP_REFRESH_TTL_SECONDS: parseInt(
      MEMBERSHIP_REFRESH_TTL_SECONDS ?? DEFAULTS.MEMBERSHIP_REFRESH_TTL_SECONDS,
      10,
    ),
    REACTION_WEIGHT_OVERRIDE: REACTION_WEIGHT_OVERRIDE
      ? parseInt(REACTION_WEIGHT_OVERRIDE, 10)
      : null,
    CW_BOT_KEY,
    ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS: parseInt(
      ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS ??
        DEFAULTS.ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS,
      10,
    ),
    AUTH: {
      SESSION_SECRET: SESSION_SECRET || DEFAULTS.SESSION_SECRET,
      MAGIC_API_KEY,
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
      BOT_TOKEN: DISCORD_BOT_TOKEN,
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
  },
  z.object({
    ENFORCE_SESSION_KEYS: z.boolean(),
    SEND_EMAILS: z.boolean(),
    SEND_WEBHOOKS_EMAILS: z
      .boolean()
      .refine((data) => !(model_config.APP_ENV !== 'production' && data)),
    NO_PRERENDER: z.boolean(),
    NO_GLOBAL_ACTIVITY_CACHE: z.boolean(),
    PRERENDER_TOKEN: z.string().optional(),
    GENERATE_IMAGE_RATE_LIMIT: z.number().int().positive(),
    DEFAULT_COMMONWEALTH_LOGO: z.string().url(),
    MEMBERSHIP_REFRESH_BATCH_SIZE: z.number().int().positive(),
    MEMBERSHIP_REFRESH_TTL_SECONDS: z.number().int().positive(),
    REACTION_WEIGHT_OVERRIDE: z.number().int().nullish(),
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
      MAGIC_API_KEY: z
        .string()
        .optional()
        .refine(
          (data) => !(model_config.APP_ENV === 'production' && !data),
          'MAGIC_API_KEY is required in production',
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
          'DISCORD_BOT_TOKEN is required in production, frick, beta (QA), and demo',
        ),
    }),
    WORKERS: z.object({
      MESSAGE_RELAYER_TIMEOUT_MS: z.number().int().positive(),
      MESSAGE_RELAYER_PREFETCH: z.number().int().positive(),
      EVM_CE_POLL_INTERVAL_MS: z.number().int().positive(),
    }),
  }),
);
