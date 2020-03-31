require('dotenv').config();

export const DEFAULT_PORT = '8080';

export const NODE_URL =
  process.env.NODE_URL || (process.env.NODE_ENV === 'production' ?
                           'ws://testnet2.edgewa.re:9944' :
                           'ws://localhost:9944');

export const NO_ARCHIVE = !!process.env.NO_ARCHIVE;

export const SERVER_URL =
  process.env.SERVER_URL || (process.env.NODE_ENV === 'production' ?
                             'https://commonwealth.im' :
                             'http://localhost:8080');

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
export const GITHUB_OAUTH_CALLBACK = (process.env.NODE_ENV === 'production' ?
                                      'https://commonwealth.im' :
                                      'http://localhost:8080') + '/api/auth/github/callback';

export const DATABASE_URI =
      (!process.env.DATABASE_URL || process.env.NODE_ENV === 'development') ?
      'postgresql://commonwealth:edgeware@localhost/commonwealth' :
      process.env.DATABASE_URL;

// limit logins in the last 5 minutes
// increased because of chain waitlist registrations
export const LOGIN_RATE_LIMIT_TRIES = 15;
export const LOGIN_RATE_LIMIT_MINS = 5;

export const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;

export const INFURA_API_KEY = process.env.INFURA_API_KEY;
