import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetByDomain(): Query<typeof schemas.GetByDomain> {
  return {
    ...schemas.GetByDomain,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const community = await models.Community.findOne({
        where: { custom_domain: payload.custom_domain },
        attributes: ['id'],
      });
      return community?.id ? { community_id: community.id } : {};
    },
  };
}
