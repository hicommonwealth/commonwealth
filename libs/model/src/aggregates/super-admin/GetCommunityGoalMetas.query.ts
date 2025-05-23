import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';

export function GetCommunityGoalMetas(): Query<
  typeof schemas.GetCommunityGoalMetas
> {
  return {
    ...schemas.GetCommunityGoalMetas,
    auth: [isSuperAdmin],
    secure: true,
    body: async () => {
      const metas = await models.CommunityGoalMeta.findAll();
      return metas.map((meta) => meta.toJSON());
    },
  };
}
