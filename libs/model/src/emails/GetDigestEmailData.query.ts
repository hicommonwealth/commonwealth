/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  EnrichedThread,
  ExternalServiceUserIds,
  GetDigestEmailData,
  Query,
} from '@hicommonwealth/core';
import { generateUnsubscribeLink, models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';

export function GetDigestEmailDataQuery(): Query<typeof GetDigestEmailData> {
  return {
    ...GetDigestEmailData,
    auth: [],
    secure: true,
    authStrategy: { type: 'authtoken', userId: ExternalServiceUserIds.Knock },
    body: async ({ payload }) => {
      // TODO User payload for unSubscribe once Recap email pr merge
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
                AND created_at > NOW() - INTERVAL '7 days'
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
      const unSubscribeLink = await generateUnsubscribeLink(payload.user_id);
      return {
        threads: threads,
        numberOfThreads: threads.length,
        unsubscribe_link: unSubscribeLink,
      };
    },
  };
}
