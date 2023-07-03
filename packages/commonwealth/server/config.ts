import { ChainBase } from 'common-common/src/types';
import * as dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || '8080';

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

export const CE_URL =
  process.env.ENTITIES_URL ||
  process.env.CE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://chain-events.herokuapp.com/api'
    : 'http://localhost:8081/api');

export const SESSION_SECRET = process.env.SESSION_SECRET || 'my secret';
export const JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';

export const LOGIN_TOKEN_EXPIRES_IN = 30;
export const ADDRESS_TOKEN_EXPIRES_IN = 10;

export const ROLLBAR_SERVER_TOKEN = process.env.ROLLBAR_SERVER_TOKEN;

export const ROLLBAR_ENV = process.env.ROLLBAR_ENV || 'local';

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
    : process.env.NODE_ENV === 'mobile'
    ? 'capacitor://localhost'
    : 'http://localhost:8080') + '/api/auth/github/callback';

export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const DISCORD_OAUTH_CALLBACK =
  process.env.DISCORD_OAUTH_CALLBACK ||
  (process.env.NODE_ENV === 'production'
    ? 'https://commonwealth.im'
    : process.env.NODE_ENV === 'mobile'
    ? 'capacitor://localhost'
    : 'http://localhost:8080') + '/api/auth/discord/callback';
export const DISCORD_OAUTH_SCOPES =
  process.env.DISCORD_OAUTH_SCOPES?.split(' ');

export const DATABASE_URI = process.env.USES_DOCKER_DB
  ? 'postgresql://commonwealth:edgeware@postgres/commonwealth' // this is because url will be hidden in CI.yaml
  : !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
  ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
  : process.env.DATABASE_URL;

export const VULTR_IP = process.env.VULTR_IP;

export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
    if (
      process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
      process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT
    ) {
      return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`;
    } else return 'amqp://127.0.0.1';
  } else return process.env.CLOUDAMQP_URL;
})();

export const RABBITMQ_API_URI = (() => {
  if (
    process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
    process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT
  )
    return `http://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT}/api`;
  else return 'http://guest:guest@localhost:15672/api';
})();

// if a tls redis url is provided then that takes priority over everything else
// then if a normal non-tls url is provided that is the second best option (local/staging)
// finally, if no redis url is specified we use the Vultr redis instance (vultr)
export const REDIS_URL = (() => {
  if (process.env.REDIS_TLS_URL) return process.env.REDIS_TLS_URL; // staging + production
  if (process.env.REDIS_URL) return process.env.REDIS_URL; // local + staging
  if (process.env.VULTR_IP && process.env.VULTR_REDIS_CONTAINER_PORT)
    // vultr
    return `redis://${process.env.VULTR_IP}:${process.env.VULTR_REDIS_CONTAINER_PORT}`;

  return undefined;
})();

// limit logins in the last 5 minutes
// increased because of chain waitlist registrations
export const LOGIN_RATE_LIMIT_TRIES = 15;
export const LOGIN_RATE_LIMIT_MINS = 5;

export const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;

export const MAGIC_API_KEY = process.env.MAGIC_API_KEY;
export const MAGIC_SUPPORTED_BASES = (process.env.MAGIC_SUPPORTED_BASES?.split(
  ','
) as ChainBase[]) || [ChainBase.Ethereum];
export const MAGIC_DEFAULT_CHAIN =
  process.env.MAGIC_DEFAULT_CHAIN || 'ethereum';

export const DEFAULT_COMMONWEALTH_LOGO =
  'https://commonwealth.im/static/brand_assets/logo_stacked.png';

export const AXIE_SHARED_SECRET = process.env.AXIE_SHARED_SECRET;

export const WEBSOCKET_ADMIN_USERNAME = process.env.WEBSOCKET_ADMIN_USERNAME;
export const WEBSOCKET_ADMIN_PASSWORD = process.env.WEBSOCKET_ADMIN_PASSWORD;

export const DISCORD_BOT_SUCCESS_URL =
  process.env.DISCORD_BOT_SUCCESS_URL || 'http://localhost:3000';

export const ETHERSCAN_JS_API_KEY = process.env.ETHERSCAN_JS_API_KEY;
export const CHAIN_EVENT_SERVICE_SECRET =
  process.env.CHAIN_EVENT_SERVICE_SECRET || 'secret';
export const ETH_RPC = process.env.ETH_RPC || 'prod';

export const COSMOS_GOV_V1 = process.env.COSMOS_GOV_V1;

export const CW_BOT_KEY = process.env.CW_BOT_KEY;
