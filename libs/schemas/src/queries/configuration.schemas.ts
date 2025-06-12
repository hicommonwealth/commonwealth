import { z } from 'zod';
import { Environments } from '../utils';

export const GetPublicEnvVar = {
  input: z.object({}),
  output: z.object({
    APP_ENV: z.string(),
    HEROKU_APP_NAME: z.string().optional(),
    NODE_ENV: z.enum(Environments),
    KNOCK_PUBLIC_API_KEY: z.string().optional(),
    KNOCK_IN_APP_FEED_ID: z.string().optional(),
    MIXPANEL_TOKEN: z.string().optional(),
    MAGIC_PUBLISHABLE_KEY: z.string(),
    LAUNCHPAD_CHAIN_ID: z.number().optional(),
    LAUNCHPAD_CONNECTOR_WEIGHT: z.number().optional(),
    LAUNCHPAD_INITIAL_PRICE: z.number().optional(),
    PRIVY_APP_ID: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    UNLEASH_FRONTEND_API_TOKEN: z.string().optional(),
    CF_TURNSTILE_CREATE_THREAD_SITE_KEY: z.string().optional(),
    CF_TURNSTILE_CREATE_COMMENT_SITE_KEY: z.string().optional(),
    CF_TURNSTILE_CREATE_COMMUNITY_SITE_KEY: z.string().optional(),
    TEST_EVM_ETH_RPC: z.string().optional(),
    TEST_EVM_PROVIDER_URL: z.string().optional(),
    ALCHEMY_PUBLIC_APP_KEY: z.string(),
    FARCASTER_NGROK_DOMAIN: z.string().nullish(),
    CONTEST_DURATION_IN_SEC: z.number().optional(),
    COMMUNITY_REDIRECTS: z.record(z.string(), z.string()),
  }),
};
