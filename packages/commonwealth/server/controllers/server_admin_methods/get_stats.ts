import { AppError } from '@hicommonwealth/core';
import { CommunityAttributes, UserInstance } from '@hicommonwealth/model';
import { CountOptions, Op, QueryTypes } from 'sequelize';
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
  lastMonthNewCommunities: Array<string>;
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
    community = await this.models.Community.findByPk(communityId);
    if (!community) {
      throw new AppError(Errors.CommunityNotFound);
    }
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const countQuery: CountOptions<{
    created_at: any;
    community_id: string;
  }> = {
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
    },
  };

  if (communityId) {
    countQuery.where = {
      ...countQuery.where,
      community_id: communityId,
    };
  }

  const [
    lastMonthNewCommunities,
    [{ monthlySummary }],
    [{ result: averageAddressesPerCommunity }],
    [{ result: populatedCommunities }],
  ] = await Promise.all([
    this.models.sequelize.query<{ id: string }>(
      `SELECT id FROM "Communities" WHERE created_at >= NOW() - INTERVAL '30 days'`,
      { type: QueryTypes.SELECT },
    ),
    this.models.sequelize.query<{ monthlySummary: TableCounts }>(
      `
      WITH MonthlyStats AS (
        SELECT 'numCommentsLastMonth' as label, COUNT(*) as count FROM "Comments" WHERE "created_at" >= :oneMonthAgo
        UNION ALL
        SELECT 'numThreadsLastMonth' as label, COUNT(*) FROM "Threads" WHERE "created_at" >= :oneMonthAgo
        UNION ALL
        SELECT 'numReactionsLastMonth' as label, COUNT(*) FROM "Reactions" WHERE "created_at" >= :oneMonthAgo
        UNION ALL
        SELECT 'numProposalVotesLastMonth' as label, COUNT(*) FROM "Votes" WHERE "created_at" >= :oneMonthAgo
        UNION ALL
        SELECT 'numPolls' as label, COUNT(*) FROM "Polls" WHERE "created_at" >= :oneMonthAgo
        UNION ALL
        SELECT 'numMembersLastMonth' as label, COUNT(*) FROM "Addresses" WHERE "created_at" >= :oneMonthAgo
        UNION ALL
        SELECT 'numGroupsLastMonth' as label, COUNT(*) FROM "Groups" WHERE "created_at" >= :oneMonthAgo
      )
      SELECT json_build_object(
        'numCommentsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numCommentsLastMonth'),
        'numThreadsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numThreadsLastMonth'),
        'numReactionsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numReactionsLastMonth'),
        'numProposalVotesLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numProposalVotesLastMonth'),
        'numPolls', (SELECT count FROM MonthlyStats WHERE label = 'numPolls'),
        'numMembersLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numMembersLastMonth'),
        'numGroupsLastMonth', (SELECT count FROM MonthlyStats WHERE label = 'numGroupsLastMonth')
      ) AS "monthlySummary";
    `,
      {
        replacements: { oneMonthAgo: oneMonthAgo },
        type: QueryTypes.SELECT,
      },
    ),
    this.models.sequelize.query<{ result: number }>(
      `
      SELECT AVG(address_count) as result
      FROM (
          SELECT "Communities".id, COUNT("Addresses".id) as address_count
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
    lastMonthNewCommunities: lastMonthNewCommunities.map(({ id }) => id),
    totalStats: {
      ...monthlySummary,
      averageAddressesPerCommunity,
      populatedCommunities,
    },
  };
}
