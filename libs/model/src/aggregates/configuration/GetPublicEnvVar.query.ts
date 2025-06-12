import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../../config';

export function GetPublicEnvVar(): Query<typeof schemas.GetPublicEnvVar> {
  return {
    ...schemas.GetPublicEnvVar,
    auth: [],
    secure: false,
    body: async () => {
      return {
        APP_ENV: config.APP_ENV,
        HEROKU_APP_NAME: config.HEROKU.HEROKU_APP_NAME,
        NODE_ENV: config.NODE_ENV,
        KNOCK_PUBLIC_API_KEY: config.NOTIFICATIONS.KNOCK_PUBLIC_API_KEY,
        KNOCK_IN_APP_FEED_ID: config.NOTIFICATIONS.KNOCK_IN_APP_FEED_ID,
        MIXPANEL_TOKEN: config.ANALYTICS.MIXPANEL_TOKEN,
        MAGIC_PUBLISHABLE_KEY: config.MAGIC_PUBLISHABLE_KEY,
        LAUNCHPAD_CHAIN_ID: config.WEB3.LAUNCHPAD_CHAIN_ID,
        LAUNCHPAD_CONNECTOR_WEIGHT: config.WEB3.LAUNCHPAD_CONNECTOR_WEIGHT,
        LAUNCHPAD_INITIAL_PRICE: config.WEB3.LAUNCHPAD_INITIAL_PRICE,
        PRIVY_APP_ID: config.PRIVY.APP_ID,
        DISCORD_CLIENT_ID: config.DISCORD.CLIENT_ID,
        UNLEASH_FRONTEND_API_TOKEN: config.UNLEASH.FRONTEND_API_TOKEN,
        CF_TURNSTILE_CREATE_THREAD_SITE_KEY:
          config.CLOUDFLARE.TURNSTILE.CREATE_THREAD?.SITE_KEY,
        CF_TURNSTILE_CREATE_COMMENT_SITE_KEY:
          config.CLOUDFLARE.TURNSTILE.CREATE_COMMENT?.SITE_KEY,
        CF_TURNSTILE_CREATE_COMMUNITY_SITE_KEY:
          config.CLOUDFLARE.TURNSTILE.CREATE_COMMUNITY?.SITE_KEY,
      };
    },
  };
}
