import { config as adapters_config } from '@hicommonwealth/adapters';
import { configure } from '@hicommonwealth/core';
import { config as evm_config } from '@hicommonwealth/evm-testing';
import { config as model_config } from '@hicommonwealth/model';
import { ChainBase } from '@hicommonwealth/shared';
import { z } from 'zod';

const {
  SENDGRID_API_KEY,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_TOKEN_DEV,
  SESSION_SECRET,
  JWT_SECRET,
  SEND_EMAILS: _SEND_EMAILS,
  NO_CLIENT: _NO_CLIENT,
  NO_PRERENDER: _NO_PRERENDER,
  NO_GLOBAL_ACTIVITY_CACHE,
  LOGIN_RATE_LIMIT_TRIES,
  LOGIN_RATE_LIMIT_MINS,
  SLACK_FEEDBACK_WEBHOOK,
  FLAG_COMMON_WALLET: _FLAG_COMMON_WALLET,
} = process.env;

const SEND_EMAILS = _SEND_EMAILS === 'true';
const NO_CLIENT = _NO_CLIENT === 'true' || SEND_EMAILS;
const NO_PRERENDER = _NO_PRERENDER || NO_CLIENT;
const FLAG_COMMON_WALLET = _FLAG_COMMON_WALLET === ' true';

export const config = configure(
  { ...model_config, ...adapters_config, ...evm_config },
  {
    SEND_EMAILS,
    NO_CLIENT,
    NO_PRERENDER: NO_PRERENDER === 'true',
    NO_GLOBAL_ACTIVITY_CACHE: NO_GLOBAL_ACTIVITY_CACHE === 'true',
    // limit logins in the last 5 minutes
    // increased because of chain waitlist registrations
    LOGIN_RATE_LIMIT_TRIES: parseInt(LOGIN_RATE_LIMIT_TRIES ?? '15', 10),
    LOGIN_RATE_LIMIT_MINS: parseInt(LOGIN_RATE_LIMIT_MINS ?? '5', 10),
    SLACK_FEEDBACK_WEBHOOK,
    FLAG_COMMON_WALLET,
    AUTH: {
      SESSION_SECRET: SESSION_SECRET || 'my secret',
      JWT_SECRET: JWT_SECRET || 'my secret',
      SESSION_EXPIRY_MILLIS: 30 * 24 * 60 * 60 * 1000,
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
  },
  z.object({
    SEND_EMAILS: z.boolean(),
    NO_CLIENT: z.boolean(),
    NO_PRERENDER: z.boolean(),
    NO_GLOBAL_ACTIVITY_CACHE: z.boolean(),
    LOGIN_RATE_LIMIT_TRIES: z.number().int(),
    LOGIN_RATE_LIMIT_MINS: z.number().int(),
    SLACK_FEEDBACK_WEBHOOK: z.string().optional(),
    FLAG_COMMON_WALLET: z.boolean().optional(),
    AUTH: z.object({
      SESSION_SECRET: z.string(),
      JWT_SECRET: z.string(),
      SESSION_EXPIRY_MILLIS: z.number().int(),
    }),
    SENDGRID: z.object({
      API_KEY: z.string().optional(),
    }),
    TELEGRAM: z.object({
      BOT_TOKEN: z.string().optional(),
    }),
  }),
);

export const ADDRESS_TOKEN_EXPIRES_IN = 10;

export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

export const MAGIC_API_KEY = process.env.MAGIC_API_KEY;
export const MAGIC_SUPPORTED_BASES = (process.env.MAGIC_SUPPORTED_BASES?.split(
  ',',
) as ChainBase[]) || [ChainBase.Ethereum];
export const MAGIC_DEFAULT_CHAIN =
  process.env.MAGIC_DEFAULT_CHAIN || 'ethereum';

export const DEFAULT_COMMONWEALTH_LOGO =
  'https://commonwealth.im/static/brand_assets/logo_stacked.png';

export const DISCORD_BOT_SUCCESS_URL =
  process.env.DISCORD_BOT_SUCCESS_URL || 'http://localhost:3000';

export const CW_BOT_KEY = process.env.CW_BOT_KEY;

// Should be false EVERYWHERE except the production `commonwealthapp` Heroku app
// Risks sending webhooks/emails to real users if incorrectly set to true
export const SEND_WEBHOOKS_EMAILS =
  process.env.NODE_ENV === 'production' &&
  process.env.SEND_WEBHOOKS_EMAILS === 'true';

export const MEMBERSHIP_REFRESH_BATCH_SIZE = process.env
  .MEMBERSHIP_REFRESH_BATCH_SIZE
  ? parseInt(process.env.MEMBERSHIP_REFRESH_BATCH_SIZE, 10)
  : 1000;

export const MEMBERSHIP_REFRESH_TTL_SECONDS = process.env
  .MEMBERSHIP_REFRESH_TTL_SECONDS
  ? parseInt(process.env.MEMBERSHIP_REFRESH_TTL_SECONDS, 10)
  : 120;

export const TBC_BALANCE_TTL_SECONDS = process.env.TBC_BALANCE_TTL_SECONDS
  ? parseInt(process.env.TBC_BALANCE_TTL_SECONDS, 10)
  : 300;

export const PRERENDER_TOKEN = process.env.PRERENDER_TOKEN;

export const REACTION_WEIGHT_OVERRIDE = process.env.REACTION_WEIGHT_OVERRIDE
  ? parseInt(process.env.REACTION_WEIGHT_OVERRIDE, 10)
  : null;

export const GENERATE_IMAGE_RATE_LIMIT = process.env.GENERATE_IMAGE_RATE_LIMIT
  ? parseInt(process.env.GENERATE_IMAGE_RATE_LIMIT, 10)
  : 10;

export const ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS = process.env
  .ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS
  ? parseInt(process.env.ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS, 10)
  : 60;

/*
 * NOTE: (1000 / MESSAGE_RELAYER_TIMEOUT_MS) * MESSAGE_RELAYER_PREFETCH = the upperbound
 * number of Outbox events (records) that can be processed per second.
 * Defaults to 1000 events per second.
 * This calculation does not account for the time it takes for messages to be
 * fetched + published (hence upperbound assuming fetching + publishing takes 0ms).
 */
export const MESSAGE_RELAYER_TIMEOUT_MS =
  parseInt(process.env.MESSAGE_RELAYER_TIMEOUT_MS || '') || 200;
export const MESSAGE_RELAYER_PREFETCH =
  parseInt(process.env.MESSAGE_RELAYER_PREFETCH || '') || 50;

export const EVM_CE_POLL_INTERVAL_MS =
  parseInt(process.env.EVM_CE_POLL_INTERVAL || '') || 120_000;
