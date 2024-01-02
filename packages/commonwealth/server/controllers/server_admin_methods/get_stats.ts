import { Op } from 'sequelize';
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
  numCommentsLastMonth: number;
  numThreadsLastMonth: number;
  numPollsLastMonth: number;
  numReactionsLastMonth: number;
  numProposalVotesLastMonth: number;
  numMembersLastMonth: number;
  numGroupsLastMonth: number;
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
  const whereChain: any = { ...where };
  const whereCommunityId: any = { ...where };
  if (community) {
    whereChain.chain = communityId;
    whereCommunityId.community_id = communityId;
  }

  const numCommentsLastMonth = await this.models.Comment.count({
    where: whereChain,
  });

  const numThreadsLastMonth = await this.models.Thread.count({
    where: whereChain,
  });

  const numReactionsLastMonth = await this.models.Reaction.count({
    where: whereChain,
  });

  const numProposalVotesLastMonth = await this.models.Vote.count({
    where: whereCommunityId,
  });

  const numPollsLastMonth = await this.models.Poll.count({
    where: whereCommunityId,
  });

  const numMembersLastMonth = await this.models.Address.count({
    where: whereCommunityId,
  });

  const numGroupsLastMonth = await this.models.Group.count({
    where: whereCommunityId,
  });

  return {
    numCommentsLastMonth,
    numThreadsLastMonth,
    numReactionsLastMonth,
    numProposalVotesLastMonth,
    numPollsLastMonth,
    numMembersLastMonth,
    numGroupsLastMonth,
  };
}
