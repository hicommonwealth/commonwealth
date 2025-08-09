import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { BindOrReplacements, QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';

export function GetStats(): Query<typeof schemas.GetStats> {
  return {
    ...schemas.GetStats,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { community_id } = payload;

      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      const replacements: BindOrReplacements = {
        oneMonthAgo,
        ...(community_id ? { community_id } : {}),
      };
      const community_filter =
        community_id && community_id !== ALL_COMMUNITIES
          ? `AND X.community_id = :community_id`
          : '';

      const [
        lastMonthNewCommunities,
        [{ monthlySummary }],
        [{ result: averageAddressesPerCommunity }],
        [{ result: populatedCommunities }],
      ] = await Promise.all([
        models.sequelize.query<{ id: string; created_at: Date }>(
          `SELECT id, created_at FROM "Communities"
       WHERE created_at >= NOW() - INTERVAL '30 days'
       ORDER BY created_at desc`,
          { type: QueryTypes.SELECT },
        ),
        models.sequelize.query<{
          monthlySummary: z.infer<typeof schemas.TotalStats>;
        }>(
          `
      WITH MonthlyStats AS (
        SELECT 
          'numCommentsLastMonth' as label, 
          COUNT(C.*) as count 
          FROM "Comments" C JOIN "Threads" X ON C.thread_id = X.id
          WHERE C."created_at" >= :oneMonthAgo
          ${community_filter}
        UNION ALL
        SELECT 
          'numThreadsLastMonth' as label, 
          COUNT(*) 
          FROM "Threads" X 
          WHERE "created_at" >= :oneMonthAgo
          ${community_filter}
        UNION ALL
        SELECT 
          'numReactionsLastMonth' as label, 
          COUNT(R.*) 
          FROM "Reactions" R
            LEFT JOIN "Threads" T ON R.thread_id = T.id 
            LEFT JOIN "Comments" C ON R.comment_id = C.id
            LEFT JOIN "Threads" TC ON C.thread_id = TC.id
          WHERE R."created_at" >= :oneMonthAgo
          ${community_filter ? `AND (T.community_id = :community_id OR TC.community_id = :community_id)` : ''}
        UNION ALL
        SELECT 
          'numProposalVotesLastMonth' as label, 
          COUNT(*) 
          FROM "Votes" X 
          WHERE "created_at" >= :oneMonthAgo
          ${community_filter}
        UNION ALL
        SELECT 
          'numPollsLastMonth' as label, 
          COUNT(*) 
          FROM "Polls" X
          WHERE "created_at" >= :oneMonthAgo
          ${community_filter}
        UNION ALL
        SELECT 
          'numMembersLastMonth' as label, 
          COUNT(*) 
          FROM "Addresses" X 
          WHERE "created_at" >= :oneMonthAgo
          ${community_filter}
        UNION ALL
        SELECT 
          'numGroupsLastMonth' as label, 
          COUNT(*) 
          FROM "Groups" X
          WHERE "created_at" >= :oneMonthAgo
          ${community_filter}
      )
      SELECT json_build_object(
        'numCommentsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numCommentsLastMonth'),
        'numThreadsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numThreadsLastMonth'),
        'numReactionsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numReactionsLastMonth'),
        'numProposalVotesLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numProposalVotesLastMonth'),
        'numPollsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numPollsLastMonth'),
        'numMembersLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numMembersLastMonth'),
        'numGroupsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numGroupsLastMonth')
      ) AS "monthlySummary";
    `,
          { replacements, type: QueryTypes.SELECT },
        ),
        models.sequelize.query<{ result: string }>(
          `
      SELECT AVG(profile_count) as result
      FROM (
          SELECT "Communities".id, COUNT("Addresses".id) as profile_count
          FROM "Communities"
          JOIN "Addresses" ON "Addresses".community_id = "Communities".id
          GROUP BY "Communities".id
      ) as _;
    `,
          { type: QueryTypes.SELECT },
        ),
        models.sequelize.query<{ result: string }>(
          `
        SELECT COUNT(communities_count) as result FROM (
          SELECT "Communities".id
          FROM "Communities"
          JOIN "Addresses" ON "Addresses".community_id = "Communities".id
          GROUP BY "Communities".id
          HAVING COUNT("Addresses".id) > 2
        ) as communities_count;
      `,
          { type: QueryTypes.SELECT },
        ),
      ]);

      return {
        lastMonthNewCommunities: lastMonthNewCommunities.map(
          ({ id, created_at }) => ({ id, created_at }),
        ),
        totalStats: {
          ...monthlySummary,
          averageAddressesPerCommunity: +averageAddressesPerCommunity,
          populatedCommunities: +populatedCommunities,
        },
      };
    },
  };
}
