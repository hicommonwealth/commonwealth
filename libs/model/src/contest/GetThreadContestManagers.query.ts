import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../database';

export function GetThreadContestManagers(): Query<
  typeof schemas.GetThreadContestManagers
> {
  return {
    ...schemas.GetThreadContestManagers,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const contestManagers = await sequelize.query<{
        contest_address: string;
      }>(
        `
            SELECT
              cm.contest_address
            FROM "Communities" c
            JOIN "ContestManagers" cm ON cm.community_id = c.id
            JOIN "ContestTopics" ct ON cm.contest_address = ct.contest_address
            WHERE ct.topic_id = :topic_id
            AND cm.community_id = :community_id
            AND cm.cancelled = false
          `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            topic_id: payload.topic_id,
            community_id: payload.community_id,
          },
        },
      );
      return contestManagers;
    },
  };
}
