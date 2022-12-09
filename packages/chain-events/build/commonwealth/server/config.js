"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAIN_EVENT_SERVICE_SECRET = exports.DISCORD_BOT_SUCCESS_URL = exports.WEBSOCKET_ADMIN_PASSWORD = exports.WEBSOCKET_ADMIN_USERNAME = exports.AXIE_SHARED_SECRET = exports.DEFAULT_COMMONWEALTH_LOGO = exports.MAGIC_DEFAULT_CHAIN = exports.MAGIC_SUPPORTED_BASES = exports.MAGIC_API_KEY = exports.MIXPANEL_TOKEN = exports.LOGIN_RATE_LIMIT_MINS = exports.LOGIN_RATE_LIMIT_TRIES = exports.REDIS_URL = exports.RABBITMQ_API_URI = exports.RABBITMQ_URI = exports.VULTR_IP = exports.DATABASE_URI = exports.DISCORD_OAUTH_SCOPES = exports.DISCORD_OAUTH_CALLBACK = exports.DISCORD_CLIENT_SECRET = exports.DISCORD_CLIENT_ID = exports.GITHUB_OAUTH_CALLBACK = exports.GITHUB_CLIENT_SECRET = exports.GITHUB_CLIENT_ID = exports.SENDGRID_API_KEY = exports.SLACK_WEBHOOKS = exports.SLACK_FEEDBACK_WEBHOOK = exports.ROLLBAR_SERVER_TOKEN = exports.ADDRESS_TOKEN_EXPIRES_IN = exports.LOGIN_TOKEN_EXPIRES_IN = exports.JWT_SECRET = exports.SESSION_SECRET = exports.ENTITIES_URL = exports.SERVER_URL = exports.NODE_URL = exports.DEFAULT_PORT = void 0;
const types_1 = require("../../common-common/src/types");
/* eslint-disable indent,prefer-template,operator-linebreak */
require('dotenv').config();
exports.DEFAULT_PORT = '8080';
exports.NODE_URL = process.env.NODE_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'ws://testnet2.edgewa.re:9944'
        : 'ws://localhost:9944');
exports.SERVER_URL = process.env.SERVER_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://commonwealth.im'
        : 'http://localhost:8080');
exports.ENTITIES_URL = process.env.ENTITIES_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://chain-events.herokuapp.com/api'
        : 'http://localhost:8081/api');
exports.SESSION_SECRET = process.env.SESSION_SECRET || 'my secret';
exports.JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';
exports.LOGIN_TOKEN_EXPIRES_IN = 30;
exports.ADDRESS_TOKEN_EXPIRES_IN = 10;
exports.ROLLBAR_SERVER_TOKEN = process.env.ROLLBAR_SERVER_TOKEN;
exports.SLACK_FEEDBACK_WEBHOOK = process.env.SLACK_FEEDBACK_WEBHOOK;
exports.SLACK_WEBHOOKS = {
    cosmos: process.env.COSMOS_SLACK_WEBHOOK,
    edgeware: process.env.EDGEWARE_SLACK_WEBHOOK,
    ethereum: process.env.ETHEREUM_SLACK_WEBHOOK,
    kusama: process.env.KUSAMA_SLACK_WEBHOOK,
    near: process.env.NEAR_SLACK_WEBHOOK,
};
exports.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
exports.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
exports.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
exports.GITHUB_OAUTH_CALLBACK = process.env.GITHUB_OAUTH_CALLBACK ||
    (process.env.NODE_ENV === 'production'
        ? 'https://commonwealth.im'
        : 'http://localhost:8080') + '/api/auth/github/callback';
exports.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
exports.DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
exports.DISCORD_OAUTH_CALLBACK = process.env.DISCORD_OAUTH_CALLBACK ||
    (process.env.NODE_ENV === 'production'
        ? 'https://commonwealth.im'
        : 'http://localhost:8080') + '/api/auth/discord/callback';
exports.DISCORD_OAUTH_SCOPES = process.env.DISCORD_OAUTH_SCOPES?.split(' ');
exports.DATABASE_URI = !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;
exports.VULTR_IP = process.env.VULTR_IP;
exports.RABBITMQ_URI = (() => {
    if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
        if (process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
            process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT) {
            return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`;
        }
        else
            return 'amqp://guest:guest@localhost:5672';
    }
    else
        return process.env.CLOUDAMQP_URL;
})();
exports.RABBITMQ_API_URI = (() => {
    if (process.env.VULTR_RABBITMQ_CONTAINER_PORT && process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT)
        return `http://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT}/api`;
    else
        return 'http://guest:guest@localhost:15672/api';
})();
// if a tls redis url is provided then that takes priority over everything else
// then if a normal non-tls url is provided that is the second best option (local/staging)
// finally, if no redis url is specified we use the Vultr redis instance (vultr)
exports.REDIS_URL = (() => {
    if (process.env.REDIS_TLS_URL)
        return process.env.REDIS_TLS_URL; // staging + production
    if (process.env.REDIS_URL)
        return process.env.REDIS_URL; // local + staging
    if (process.env.VULTR_IP && process.env.VULTR_REDIS_CONTAINER_PORT) // vultr
        return `redis://${process.env.VULTR_IP}:${process.env.VULTR_REDIS_CONTAINER_PORT}`;
    return undefined;
})();
// limit logins in the last 5 minutes
// increased because of chain waitlist registrations
exports.LOGIN_RATE_LIMIT_TRIES = 15;
exports.LOGIN_RATE_LIMIT_MINS = 5;
exports.MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;
exports.MAGIC_API_KEY = process.env.MAGIC_API_KEY;
exports.MAGIC_SUPPORTED_BASES = process.env.MAGIC_SUPPORTED_BASES?.split(',') || [types_1.ChainBase.Ethereum];
exports.MAGIC_DEFAULT_CHAIN = process.env.MAGIC_DEFAULT_CHAIN || 'ethereum';
exports.DEFAULT_COMMONWEALTH_LOGO = 'https://commonwealth.im/static/brand_assets/logo_stacked.png';
exports.AXIE_SHARED_SECRET = process.env.AXIE_SHARED_SECRET;
exports.WEBSOCKET_ADMIN_USERNAME = process.env.WEBSOCKET_ADMIN_USERNAME;
exports.WEBSOCKET_ADMIN_PASSWORD = process.env.WEBSOCKET_ADMIN_PASSWORD;
exports.DISCORD_BOT_SUCCESS_URL = process.env.DISCORD_BOT_SUCCESS_URL || 'http://localhost:3000';
exports.CHAIN_EVENT_SERVICE_SECRET = process.env.CHAIN_EVENT_SERVICE_SECRET || 'secret';
