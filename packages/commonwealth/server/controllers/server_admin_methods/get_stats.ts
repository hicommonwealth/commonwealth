import { AppError } from '@hicommonwealth/core';
import { CommunityAttributes, UserInstance } from '@hicommonwealth/model';
import { Op, QueryTypes, WhereOptions } from 'sequelize';
import { ServerAdminController } from '../server_admin_controller';

export const Errors = {
  NotAdmin: 'Must be a site admin',
  CommunityNotFound: 'Community not found',
};

export type GetStatsOptions = {
  user: UserInstance;
  communityId?: string;
};

export type GetStatsResult = {
  lastMonthNewCommunities: Array<string>;
  totalStats: {
    numCommentsLastMonth: number;
    numThreadsLastMonth: number;
    numPollsLastMonth: number;
    numReactionsLastMonth: number;
    numProposalVotesLastMonth: number;
    numMembersLastMonth: number;
    numGroupsLastMonth: number;
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

  const where = {
    created_at: {
      [Op.gte]: oneMonthAgo,
    },
  };
  const whereChain: WhereOptions<{
    created_at: any;
    chain: string;
  }> = {
    ...where,
  };
  const whereCommunityId: WhereOptions<{
    created_at: any;
    community_id: string;
  }> = { ...where };

  if (community) {
    whereChain.chain = communityId;
    whereCommunityId.community_id = communityId;
  }

  const [
    lastMonthNewCommunities,
    numCommentsLastMonth,
    numThreadsLastMonth,
    numReactionsLastMonth,
    numProposalVotesLastMonth,
    numPollsLastMonth,
    numMembersLastMonth,
    numGroupsLastMonth,
    [{ result: averageAddressesPerCommunity }],
    [{ result: populatedCommunities }],
  ] = await Promise.all([
    this.models.sequelize.query<{ id: string }>(
      `SELECT id FROM "Communities" WHERE created_at >= NOW() - INTERVAL '30 days'`,
      { type: QueryTypes.SELECT },
    ),
    this.models.Comment.count({
      where: whereCommunityId,
    }),
    this.models.Thread.count({
      where: whereCommunityId,
    }),
    this.models.Reaction.count({
      where: whereCommunityId,
    }),
    this.models.Vote.count({
      where: whereCommunityId,
    }),
    this.models.Poll.count({
      where: whereCommunityId,
    }),
    this.models.Address.count({
      where: whereCommunityId,
    }),
    this.models.Group.count({
      where: whereCommunityId,
    }),
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
      numCommentsLastMonth,
      numThreadsLastMonth,
      numReactionsLastMonth,
      numProposalVotesLastMonth,
      numPollsLastMonth,
      numMembersLastMonth,
      numGroupsLastMonth,
      averageAddressesPerCommunity,
      populatedCommunities,
    },
  };
}
