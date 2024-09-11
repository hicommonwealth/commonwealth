import type { Query } from '@hicommonwealth/core';
import { AppError, config } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { isSuperAdmin, type AuthContext } from '../middleware';

/**
 * This function will refresh the acm status for a custom domain in heroku and provide a status update
 * @constructor
 */
export function RefreshCustomDomain(): Query<
  typeof schemas.RefreshCustomDomain,
  AuthContext
> {
  return {
    ...schemas.RefreshCustomDomain,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { custom_domain } = payload;

      const url = `https://api.heroku.com/apps/${config.HEROKU.HEROKU_APP_NAME}/domains`;
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.heroku+json; version=3',
        Authorization: `Bearer ${config.HEROKU.HEROKU_API_TOKEN}`,
      };

      const response = await fetch(`${url}/${custom_domain}`, {
        method: 'GET',
        headers,
      });

      const domain = await response.json();

      if (domain.id === 'not_found') {
        throw new AppError('Custom domain does not exist');
      }

      return {
        hostname: domain.hostname,
        cname: domain.cname,
        cert_status: domain.acm_status,
        status: domain.status,
        reason: domain.reason,
      };
    },
  };
}
