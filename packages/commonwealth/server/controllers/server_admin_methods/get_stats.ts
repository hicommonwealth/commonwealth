import { Op, QueryTypes, WhereOptions } from 'sequelize';
import { AppError } from '../../../../common-common/src/errors';
import { CommunityAttributes } from '../../models/community';
import { UserInstance } from '../../models/user';
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
  ] = await Promise.all([
    this.models.sequelize.query<{ id: string }>(
      `SELECT id FROM "Communities" WHERE created_at >= NOW() - INTERVAL '30 days'`,
      { type: QueryTypes.SELECT },
    ),
    this.models.Comment.count({
      where: whereCommunityId,
    }),
    this.models.Thread.count({
      where: whereChain,
    }),
    this.models.Reaction.count({
      where: whereChain,
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
    },
  };
}
