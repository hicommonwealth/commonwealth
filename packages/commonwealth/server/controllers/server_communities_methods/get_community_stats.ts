import { Op } from 'sequelize';
import { UserInstance } from 'server/models/user';
import { AppError } from '../../../../common-common/src/errors';
import { ServerCommunitiesController } from '../server_communities_controller';

export const Errors = {
  NotAdmin: 'Must be a site admin',
  CommunityNotFound: 'Community not found',
};

export type GetCommunityStatsOptions = {
  user: UserInstance;
  communityId: string;
};

export type GetCommunityStatsResult = {
  numCommentsLastMonth: number;
  numThreadsLastMonth: number;
  numPollsLastMonth: number;
  numReactionsLastMonth: number;
  numProposalVotesLastMonth: number;
  numMembersLastMonth: number;
};

export async function __getCommunityStats(
  this: ServerCommunitiesController,
  { user, communityId }: GetCommunityStatsOptions,
): Promise<GetCommunityStatsResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const community = await this.models.Community.findByPk(communityId);
  if (!community) {
    throw new AppError(Errors.CommunityNotFound);
  }

  // Community Stats
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  // Count for Comments
  const numCommentsLastMonth = await this.models.Comment.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      community_id: communityId,
    },
  });

  // Count for Threads
  const numThreadsLastMonth = await this.models.Thread.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      chain: communityId,
    },
  });

  // Count for Reactions
  const numReactionsLastMonth = await this.models.Reaction.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      chain: communityId,
    },
  });

  // Count for Votes
  const numProposalVotesLastMonth = await this.models.Vote.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      community_id: communityId,
    },
  });

  // Count for Polls
  const numPollsLastMonth = await this.models.Poll.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      community_id: communityId,
    },
  });

  const numMembersLastMonth = await this.models.Address.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      community_id: community.id,
    },
  });

  // Aggregate results

  return {
    numCommentsLastMonth,
    numThreadsLastMonth,
    numReactionsLastMonth,
    numProposalVotesLastMonth,
    numPollsLastMonth,
    numMembersLastMonth,
  };
}
