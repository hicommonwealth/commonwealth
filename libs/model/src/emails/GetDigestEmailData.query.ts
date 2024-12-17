import {
  EnrichedThread,
  ExternalServiceUserIds,
  GetDigestEmailData,
  Query,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';

export function GetDigestEmailDataQuery(): Query<typeof GetDigestEmailData> {
  return {
    ...GetDigestEmailData,
    auth: [],
    secure: true,
    authStrategy: { name: 'authtoken', userId: ExternalServiceUserIds.Knock },
    body: async ({ payload }) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(new Date().getDate() - 20);
      const threads = await models.sequelize.query<
        z.infer<typeof EnrichedThread>
      >(
        `
          SELECT communities.name, communities.icon_url, top_threads.*, users.profile->>'name' AS author
          FROM (SELECT C.id, name, icon_url
                FROM "Communities" C
                WHERE C.include_in_digest_email = true) communities
                   JOIN LATERAL (
              SELECT *
              FROM "Threads" T
              WHERE T.community_id = communities.id
                AND created_at > NOW() - INTERVAL '700 days'
              ORDER BY T.view_count DESC
              LIMIT 2
              ) top_threads ON true
              LEFT JOIN "Users" users ON users.id = top_threads.address_id
              ORDER BY communities.id;
      `,
        {
          type: QueryTypes.SELECT,
          raw: true,
        },
      );

      return {
        threads: threads,
        numberOfThreads: threads.length,
        // unsubscribe_link: TODO : will add once email recap pr got merged
      };
    },
  };
}
