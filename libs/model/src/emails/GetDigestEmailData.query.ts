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
    authStrategy: { type: 'authtoken', userId: ExternalServiceUserIds.Knock },
    body: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(new Date().getDate() - 7);
      const threads = await models.sequelize.query<
        z.infer<typeof EnrichedThread>
      >(
        `
          SELECT communities.name, communities.icon_url, top_threads.*
          FROM (SELECT C.id, name, icon_url
                FROM "Communities" C
                WHERE C.include_in_digest_email = true) communities
                   JOIN LATERAL (
              SELECT *
              FROM "Threads" T
              WHERE T.community_id = communities.id
                AND created_at > NOW() - INTERVAL '10 months'
              ORDER BY T.view_count DESC
              LIMIT 2
              ) top_threads ON true;
      `,
        {
          type: QueryTypes.SELECT,
          raw: true,
        },
      );

      if (!threads.length) return {};

      const result: z.infer<(typeof GetDigestEmailData)['output']> = {};
      for (const thread of threads) {
        if (!result[thread.community_id]) {
          result[thread.community_id] = [thread];
        } else {
          result[thread.community_id].push(thread);
        }
      }

      return result;
    },
  };
}
