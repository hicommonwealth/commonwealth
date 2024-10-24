import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetThreadCount(): Query<typeof schemas.GetThreadCount> {
  return {
    ...schemas.GetThreadCount,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      return await models.Thread.count({
        where: {
          community_id: payload.community_id,
        },
      });
    },
  };
}
