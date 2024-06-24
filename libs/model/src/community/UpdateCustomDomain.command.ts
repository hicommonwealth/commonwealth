import type { Command } from '@hicommonwealth/core';
import { AppError, config, ServerError } from '@hicommonwealth/core';
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

      if (!config.HEROKU.HEROKU_APP_NAME || !config.HEROKU.HEROKU_API_TOKEN) {
        throw new ServerError('HEROKU_APP_NAME or HEROKU_API_TOKEN not set');
      }

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
        throw new AppError('Custom Domain is already registered');
      }

      await models.sequelize.transaction(async (t) => {
        await models.Community.update(
          {
            custom_domain,
          },
          {
            where: {
              id: community_id,
            },
            transaction: t,
          },
        );
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ hostname: custom_domain }),
        });
      });

      const domainStatus = await response.json();

      console.log(domainStatus);

      return domainStatus as string;
    },
  };
}
