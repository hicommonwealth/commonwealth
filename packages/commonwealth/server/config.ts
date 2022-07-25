import { ChainBase } from 'common-common/src/types';

/* eslint-disable indent,prefer-template,operator-linebreak */
require('dotenv').config();

export const DEFAULT_PORT = '8080';

export const NODE_URL =
  process.env.NODE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'ws://testnet2.edgewa.re:9944'
    : 'ws://localhost:9944');

export const SERVER_URL =
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://commonwealth.im'
    : 'http://localhost:8080');

export const SESSION_SECRET = process.env.SESSION_SECRET || 'my secret';
export const JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';

export const LOGIN_TOKEN_EXPIRES_IN = 30;
export const ADDRESS_TOKEN_EXPIRES_IN = 10;

export const ROLLBAR_SERVER_TOKEN = process.env.ROLLBAR_SERVER_TOKEN;

export const SLACK_FEEDBACK_WEBHOOK = process.env.SLACK_FEEDBACK_WEBHOOK;

export const SLACK_WEBHOOKS = {
  cosmos: process.env.COSMOS_SLACK_WEBHOOK,
  edgeware: process.env.EDGEWARE_SLACK_WEBHOOK,
  ethereum: process.env.ETHEREUM_SLACK_WEBHOOK,
  kusama: process.env.KUSAMA_SLACK_WEBHOOK,
  near: process.env.NEAR_SLACK_WEBHOOK,
};

export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
export const GITHUB_OAUTH_CALLBACK =
  process.env.GITHUB_OAUTH_CALLBACK ||
  (process.env.NODE_ENV === 'production'
    ? 'https://commonwealth.im'
    : 'http://localhost:8080') + '/api/auth/github/callback';

export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const DISCORD_OAUTH_CALLBACK =
  process.env.DISCORD_OAUTH_CALLBACK ||
  (process.env.NODE_ENV === 'production'
    ? 'https://commonwealth.im'
    : 'http://localhost:8080') + '/api/auth/discord/callback';
export const DISCORD_OAUTH_SCOPES =
  process.env.DISCORD_OAUTH_SCOPES?.split(' ');

export const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

export const VULTR_IP = process.env.VULTR_IP;

export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
    if (process.env.VULTR_RABBITMQ_CONTAINER_PORT && process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT) {
      return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`
    } else return 'amqp://guest:guest@localhost:5672'
  } else return process.env.CLOUDAMQP_URL
})()

// if REDIS_URL exists use that (production or local redis instance) otherwise if
// the Vultr server info is given then use that. Undefined otherwise.
export const REDIS_URL = process.env.REDIS_URL ? process.env.REDIS_URL :
  process.env.VULTR_IP && process.env.VULTR_REDIS_CONTAINER_PORT ? `${process.env.VULTR_IP}:${process.env.VULTR_REDIS_CONTAINER_PORT}` : undefined

// limit logins in the last 5 minutes
// increased because of chain waitlist registrations
export const LOGIN_RATE_LIMIT_TRIES = 15;
export const LOGIN_RATE_LIMIT_MINS = 5;

export const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;

export const MAGIC_API_KEY = process.env.MAGIC_API_KEY;
export const MAGIC_SUPPORTED_BASES = (process.env.MAGIC_SUPPORTED_BASES?.split(
  ','
) as ChainBase[]) || [ChainBase.Ethereum, ChainBase.Substrate];
export const MAGIC_DEFAULT_CHAIN =
  process.env.MAGIC_DEFAULT_CHAIN || 'ethereum';

export const DEFAULT_COMMONWEALTH_LOGO =
  'https://commonwealth.im/static/img/logo.png';

export const AXIE_SHARED_SECRET = process.env.AXIE_SHARED_SECRET;

export const WEBSOCKET_ADMIN_USERNAME = process.env.WEBSOCKET_ADMIN_USERNAME;
export const WEBSOCKET_ADMIN_PASSWORD = process.env.WEBSOCKET_ADMIN_PASSWORD;
