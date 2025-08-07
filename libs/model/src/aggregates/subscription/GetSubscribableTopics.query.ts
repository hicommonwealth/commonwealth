import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function GetSubscribableTopics(): Query<
  typeof schemas.GetSubscribableTopics
> {
  return {
    ...schemas.GetSubscribableTopics,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return await models.sequelize.query<{
        id: number;
        name: string;
        community_id: string;
      }>(
        `
            SELECT T.id, T.name, T.community_id
            FROM "Topics" T
            JOIN "Addresses" A ON T.community_id = A.community_id
            LEFT JOIN "TopicSubscriptions" TS ON T.id = TS.topic_id
            WHERE T.deleted_at IS NULL AND A.user_id = :user_id AND TS.user_id IS NULL
            GROUP BY T.id, T.name, T.community_id;
        `,
        {
          replacements: { user_id: actor.user.id },
          type: QueryTypes.SELECT,
          raw: true,
        },
      );
    },
  };
}
