import { AppError } from '@hicommonwealth/core';
import { CommunityAttributes, UserInstance } from '@hicommonwealth/model';
import { BindOrReplacements, QueryTypes } from 'sequelize';
import { ServerAdminController } from '../server_admin_controller';

export const Errors = {
  NotAdmin: 'Must be a site admin',
  CommunityNotFound: 'Community not found',
};

export type GetStatsOptions = {
  user: UserInstance;
  communityId?: string;
};

type TableCounts = {
  numCommentsLastMonth: number;
  numThreadsLastMonth: number;
  numPollsLastMonth: number;
  numReactionsLastMonth: number;
  numProposalVotesLastMonth: number;
  numMembersLastMonth: number;
  numGroupsLastMonth: number;
};

export type GetStatsResult = {
  lastMonthNewCommunities: Array<{ id: string; created_at: string }>;
  totalStats: TableCounts & {
    averageAddressesPerCommunity: number;
    populatedCommunities: number;
  };
};

export async function __getStats(
  this: ServerAdminController,
  { user, communityId }: GetStatsOptions,
): Promise<GetStatsResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  // community is optional
  let community: CommunityAttributes | undefined = undefined;
  if (communityId) {
    // @ts-expect-error StrictNullChecks
    community = await this.models.Community.findByPk(communityId);
    if (!community) {
      throw new AppError(Errors.CommunityNotFound);
    }
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const monthlyStatsReplacements: BindOrReplacements = {
    oneMonthAgo,
    ...(community ? { communityId: community.id } : {}),
  };

  const [
    lastMonthNewCommunities,
    [{ monthlySummary }],
    [{ result: averageAddressesPerCommunity }],
    [{ result: populatedCommunities }],
  ] = await Promise.all([
    this.models.sequelize.query<{ id: string; created_at: string }>(
      `SELECT id, created_at FROM "Communities"
       WHERE created_at >= NOW() - INTERVAL '30 days'
       ORDER BY created_at desc`,
      { type: QueryTypes.SELECT },
    ),
    this.models.sequelize.query<{ monthlySummary: TableCounts }>(
      `
      WITH MonthlyStats AS (
        SELECT 
          'numCommentsLastMonth' as label, 
          COUNT(C.*) as count 
          FROM "Comments" C JOIN "Threads" T ON C.thread_id = T.id
          WHERE C."created_at" >= :oneMonthAgo
          ${community ? `AND T.community_id = :communityId` : ''}
        UNION ALL
        SELECT 
          'numThreadsLastMonth' as label, 
          COUNT(*) 
          FROM "Threads" 
          WHERE "created_at" >= :oneMonthAgo
          ${community ? `AND community_id = :communityId` : ''}
        UNION ALL
        SELECT 
          'numReactionsLastMonth' as label, 
          COUNT(R.*) 
          FROM "Reactions" R
            LEFT JOIN "Threads" T ON R.thread_id = T.id ${community ? `AND T.community_id = :communityId` : ''}
            LEFT JOIN "Comments" C ON R.comment_id = C.id
            LEFT JOIN "Threads" TC ON C.thread_id = TC.id ${community ? `AND TC.community_id = :communityId` : ''}
          WHERE R."created_at" >= :oneMonthAgo
        UNION ALL
        SELECT 
          'numProposalVotesLastMonth' as label, 
          COUNT(*) 
          FROM "Votes" 
          WHERE "created_at" >= :oneMonthAgo
          ${community ? `AND community_id = :communityId` : ''}
        UNION ALL
        SELECT 
          'numPollsLastMonth' as label, 
          COUNT(*) 
          FROM "Polls" 
          WHERE "created_at" >= :oneMonthAgo
          ${community ? `AND community_id = :communityId` : ''}
        UNION ALL
        SELECT 
          'numMembersLastMonth' as label, 
          COUNT(*) 
          FROM "Addresses" 
          WHERE "created_at" >= :oneMonthAgo
          ${community ? `AND community_id = :communityId` : ''}
        UNION ALL
        SELECT 
          'numGroupsLastMonth' as label, 
          COUNT(*) 
          FROM "Groups" 
          WHERE "created_at" >= :oneMonthAgo
          ${community ? `AND community_id = :communityId` : ''}
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
      {
        replacements: monthlyStatsReplacements,
        type: QueryTypes.SELECT,
      },
    ),
    this.models.sequelize.query<{ result: number }>(
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
    this.models.sequelize.query<{ result: number }>(
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
      averageAddressesPerCommunity,
      populatedCommunities,
    },
  };
}
