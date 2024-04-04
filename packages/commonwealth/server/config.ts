import { ChainBase } from '@hicommonwealth/core';
import * as dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';

export const PORT = process.env.PORT || '8080';

export const SERVER_URL =
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://commonwealth.im'
    : 'http://localhost:8080');

export const SESSION_SECRET = process.env.SESSION_SECRET || 'my secret';
export const JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';

export const ADDRESS_TOKEN_EXPIRES_IN = 10;

export const SLACK_FEEDBACK_WEBHOOK = process.env.SLACK_FEEDBACK_WEBHOOK;

export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

export const RABBITMQ_URI = process.env.CLOUDAMQP_URL ?? 'amqp://127.0.0.1';

// if a tls redis url is provided then that takes priority over everything else
// then if a normal non-tls url is provided that is the second best option (local/staging)
export const REDIS_URL = (() => {
  if (process.env.REDIS_TLS_URL) return process.env.REDIS_TLS_URL; // staging + production
  if (process.env.REDIS_URL) return process.env.REDIS_URL; // local + staging
  return undefined;
})();

// limit logins in the last 5 minutes
// increased because of chain waitlist registrations
export const LOGIN_RATE_LIMIT_TRIES = 15;
export const LOGIN_RATE_LIMIT_MINS = 5;

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

export const ETHERSCAN_JS_API_KEY = process.env.ETHERSCAN_JS_API_KEY;
export const ETH_RPC = process.env.ETH_RPC || 'prod';

export const COSMOS_GOV_V1_CHAIN_IDS = process.env.COSMOS_GOV_V1
  ? process.env.COSMOS_GOV_V1.split(',')
  : [];

export const COSMOS_REGISTRY_API =
  process.env.COSMOS_REGISTRY_API || 'https://cosmoschains.thesilverfox.pro';

export const CW_BOT_KEY = process.env.CW_BOT_KEY;
// Don't set default value so if env var is not set the database cleaner will not run
export const DATABASE_CLEAN_HOUR = process.env.DATABASE_CLEAN_HOUR;

export const TELEGRAM_BOT_TOKEN =
  process.env.NODE_ENV === 'production'
    ? process.env.TELEGRAM_BOT_TOKEN
    : process.env.TELEGRAM_BOT_TOKEN_DEV;

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
  parseInt(process.env.MESSAGE_RELAYER_TIMEOUT_MS) || 200;
export const MESSAGE_RELAYER_PREFETCH =
  parseInt(process.env.MESSAGE_RELAYER_PREFETCH) || 50;

export const EVM_CE_POLL_INTERVAL_MS =
  parseInt(process.env.EVM_CE_POLL_INTERVAL) || 120_000;
