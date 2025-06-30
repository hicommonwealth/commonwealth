import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../../database';
import { authOptionalVerified } from '../../middleware';
import { buildUserActivityQuery } from '../../utils/getBaseActivityFeed';

export function GetUserActivity(): Query<typeof schemas.ActivityFeed> {
  return {
    ...schemas.ActivityFeed,
    auth: [authOptionalVerified],
    secure: true,
    body: async ({ payload, actor }) => {
      const { comment_limit = 3, limit = 10, cursor = 1 } = payload;

      const query = buildUserActivityQuery(actor);
      const offset = (cursor - 1) * limit;
      const threads = await models.sequelize.query<
        z.infer<typeof schemas.ThreadView> & { total?: number }
      >(query, {
        type: QueryTypes.SELECT,
        raw: true,
        replacements: {
          user_id: actor.user?.id || 0,
          limit,
          comment_limit,
          offset,
        },
      });

      return schemas.buildPaginatedResponse(
        threads,
        +(threads.at(0)?.total ?? 0),
        {
          limit,
          offset,
        },
      );
    },
  };
}
