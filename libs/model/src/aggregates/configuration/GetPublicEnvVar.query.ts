import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { config } from '../../config';
import { models } from '../../database';

export function GetPublicEnvVar(): Query<typeof schemas.GetPublicEnvVar> {
  return {
    ...schemas.GetPublicEnvVar,
    auth: [],
    secure: false,
    body: async () => {
      // TODO: cache the result of this query since redirects change very rarely
      const communities = await models.Community.findAll({
        attributes: ['id', 'redirect'],
        where: {
          redirect: {
            [Op.ne]: null,
          },
        },
      });

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
        TEST_EVM_ETH_RPC: config.TEST_EVM.ETH_RPC,
        TEST_EVM_PROVIDER_URL: config.TEST_EVM.PROVIDER_URL,
        ALCHEMY_PUBLIC_APP_KEY: config.ALCHEMY.APP_KEYS.PUBLIC,
        // FARCASTER_NGROK_DOMAIN should only be setup on local development
        FARCASTER_NGROK_DOMAIN: config.CONTESTS.FARCASTER_NGROK_DOMAIN,
        CONTEST_DURATION_IN_SEC: config.CONTESTS.CONTEST_DURATION_IN_SEC,
        COMMUNITY_REDIRECTS: communities.reduce(
          (acc, community) => {
            acc[community.redirect!] = community.id;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    },
  };
}
