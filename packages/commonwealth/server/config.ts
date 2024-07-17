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
  LOGIN_RATE_LIMIT_TRIES,
  LOGIN_RATE_LIMIT_MINS,
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
  DISCORD_BOT_SUCCESS_URL,
  REACTION_WEIGHT_OVERRIDE,
  CW_BOT_KEY,
  ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS,
  MESSAGE_RELAYER_TIMEOUT_MS,
  MESSAGE_RELAYER_PREFETCH,
  EVM_CE_POLL_INTERVAL,
} = process.env;

const SEND_EMAILS = _SEND_EMAILS === 'true';
const NO_PRERENDER = _NO_PRERENDER;

export const config = configure(
  { ...model_config, ...adapters_config, ...evm_config },
  {
    ENFORCE_SESSION_KEYS: ENFORCE_SESSION_KEYS === 'true',
    SEND_EMAILS,
    // Should be false EVERYWHERE except the production `commonwealthapp` Heroku app
    // Risks sending webhooks/emails to real users if incorrectly set to true
    SEND_WEBHOOKS_EMAILS:
      model_config.NODE_ENV === 'production' && SEND_WEBHOOKS_EMAILS === 'true',
    NO_PRERENDER: NO_PRERENDER === 'true',
    NO_GLOBAL_ACTIVITY_CACHE: NO_GLOBAL_ACTIVITY_CACHE === 'true',
    // limit logins in the last 5 minutes
    // increased because of chain waitlist registrations
    LOGIN_RATE_LIMIT_TRIES: parseInt(LOGIN_RATE_LIMIT_TRIES ?? '15', 10),
    LOGIN_RATE_LIMIT_MINS: parseInt(LOGIN_RATE_LIMIT_MINS ?? '5', 10),
    PRERENDER_TOKEN,
    GENERATE_IMAGE_RATE_LIMIT: parseInt(GENERATE_IMAGE_RATE_LIMIT ?? '10', 10),
    DEFAULT_COMMONWEALTH_LOGO:
      DEFAULT_COMMONWEALTH_LOGO ??
      'https://commonwealth.im/static/brand_assets/logo_stacked.png',
    MEMBERSHIP_REFRESH_BATCH_SIZE: parseInt(
      MEMBERSHIP_REFRESH_BATCH_SIZE ?? '1000',
      10,
    ),
    MEMBERSHIP_REFRESH_TTL_SECONDS: parseInt(
      MEMBERSHIP_REFRESH_TTL_SECONDS ?? '120',
      10,
    ),
    REACTION_WEIGHT_OVERRIDE: REACTION_WEIGHT_OVERRIDE
      ? parseInt(REACTION_WEIGHT_OVERRIDE, 10)
      : null,
    CW_BOT_KEY,
    ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS: parseInt(
      ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS ?? '60',
      10,
    ),
    AUTH: {
      SESSION_SECRET: SESSION_SECRET || 'my secret',
      MAGIC_API_KEY,
      MAGIC_SUPPORTED_BASES: (MAGIC_SUPPORTED_BASES?.split(
        ',',
      ) as ChainBase[]) || [ChainBase.Ethereum],
      MAGIC_DEFAULT_CHAIN:
        (MAGIC_DEFAULT_CHAIN as ChainBase) ?? ChainBase.Ethereum,
      ADDRESS_TOKEN_EXPIRES_IN: parseInt(ADDRESS_TOKEN_EXPIRES_IN ?? '10', 10),
    },
    SENDGRID: {
      API_KEY: SENDGRID_API_KEY,
    },
    TELEGRAM: {
      BOT_TOKEN:
        model_config.NODE_ENV === 'production'
          ? TELEGRAM_BOT_TOKEN
          : TELEGRAM_BOT_TOKEN_DEV,
    },
    DISCORD: {
      CLIENT_ID: DISCORD_CLIENT_ID,
      BOT_TOKEN: DISCORD_BOT_TOKEN,
      BOT_SUCCESS_URL: DISCORD_BOT_SUCCESS_URL || 'http://localhost:3000',
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
        MESSAGE_RELAYER_TIMEOUT_MS ?? '200',
        10,
      ),
      MESSAGE_RELAYER_PREFETCH: parseInt(MESSAGE_RELAYER_PREFETCH ?? '50', 10),
      EVM_CE_POLL_INTERVAL_MS: parseInt(EVM_CE_POLL_INTERVAL ?? '120000', 10),
    },
  },
  z.object({
    ENFORCE_SESSION_KEYS: z.boolean(),
    SEND_EMAILS: z.boolean(),
    SEND_WEBHOOKS_EMAILS: z.boolean(),
    NO_PRERENDER: z.boolean(),
    NO_GLOBAL_ACTIVITY_CACHE: z.boolean(),
    LOGIN_RATE_LIMIT_TRIES: z.number().int().positive(),
    LOGIN_RATE_LIMIT_MINS: z.number().int().positive(),
    PRERENDER_TOKEN: z.string().optional(),
    GENERATE_IMAGE_RATE_LIMIT: z.number().int().positive(),
    DEFAULT_COMMONWEALTH_LOGO: z.string().url(),
    MEMBERSHIP_REFRESH_BATCH_SIZE: z.number().int().positive(),
    MEMBERSHIP_REFRESH_TTL_SECONDS: z.number().int().positive(),
    REACTION_WEIGHT_OVERRIDE: z.number().int().nullish(),
    CW_BOT_KEY: z.string().optional(),
    ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS: z.number().int().positive(),
    AUTH: z.object({
      SESSION_SECRET: z.string(),
      MAGIC_API_KEY: z.string().optional(),
      MAGIC_SUPPORTED_BASES: z.array(z.nativeEnum(ChainBase)),
      MAGIC_DEFAULT_CHAIN: z.nativeEnum(ChainBase),
      ADDRESS_TOKEN_EXPIRES_IN: z.number().int(),
    }),
    SENDGRID: z.object({
      API_KEY: z.string().optional(),
    }),
    TELEGRAM: z.object({
      BOT_TOKEN: z.string().optional(),
    }),
    DISCORD: z.object({
      CLIENT_ID: z.string().optional(),
      BOT_TOKEN: z.string().optional(),
      BOT_SUCCESS_URL: z.string(),
    }),
    WORKERS: z.object({
      MESSAGE_RELAYER_TIMEOUT_MS: z.number().int().positive(),
      MESSAGE_RELAYER_PREFETCH: z.number().int().positive(),
      EVM_CE_POLL_INTERVAL_MS: z.number().int().positive(),
    }),
  }),
);
