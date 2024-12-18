import type { Command } from '@hicommonwealth/core';
import { AppError, config } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isSuperAdmin } from '../middleware';

/**
 * This function will add the custom domain to the database as well as add an entry in heroku.
 * @constructor
 */
export function UpdateCustomDomain(): Command<
  typeof schemas.UpdateCustomDomain
> {
  return {
    ...schemas.UpdateCustomDomain,
    auth: [isSuperAdmin],
    body: async ({ payload }) => {
      const { community_id, custom_domain } = payload;

      const url = `https://api.heroku.com/apps/${config.HEROKU.HEROKU_APP_NAME}/domains`;
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.heroku+json; version=3',
        Authorization: `Bearer ${config.HEROKU.HEROKU_API_TOKEN}`,
      };

      let response = await fetch(`${url}/${custom_domain}`, {
        method: 'GET',
        headers,
      });

      const domain = await response.json();

      if (domain.id !== 'not_found') {
        throw new AppError(
          'Custom Domain is already registered to some community.' +
            ' If it is not the correct community, contact engineering',
        );
      }

      const magicRequestDomain = await fetch(
        `https://api.magic.link/v2/api/magic_client/domain/allowlist/add`,
        {
          method: 'POST',
          headers: {
            'X-Magic-Secret-Key': config.MAGIC_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_type: 'domain',
            target_client_id: config.MAGIC_CLIENT_ID!,
            value: `https://${custom_domain}`,
          }),
        },
      );

      const magicRequestRedirectUrl = await fetch(
        `https://api.magic.link/v2/api/magic_client/redirect_url/allowlist/add`,
        {
          method: 'POST',
          headers: {
            'X-Magic-Secret-Key': config.MAGIC_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_type: 'redirect_url',
            target_client_id: config.MAGIC_CLIENT_ID!,
            value: `https://${custom_domain}/finishsociallogin`,
          }),
        },
      );

      const magicResponseDomain = await magicRequestDomain.json();
      const magicResponseRedirectUrl = await magicRequestRedirectUrl.json();

      if (
        magicResponseDomain.status === 'failed' &&
        magicResponseDomain.error_code != 'ALREADY_WHITELISTED_DOMAIN'
      ) {
        throw new AppError(magicResponseDomain.message);
      }

      if (
        magicResponseRedirectUrl.status === 'failed' &&
        magicResponseRedirectUrl.error_code != 'ALREADY_WHITELISTED_DOMAIN'
      ) {
        throw new AppError(magicResponseRedirectUrl.message);
      }

      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ hostname: custom_domain, sni_endpoint: null }),
      });

      const domainStatus = await response.json();

      if (domainStatus.acm_status === undefined) {
        throw new AppError(domainStatus.message);
      }

      await models.Community.update(
        {
          custom_domain,
        },
        {
          where: {
            id: community_id,
          },
        },
      );

      return domainStatus;
    },
  };
}
