import { Op } from 'sequelize';
import { UserInstance } from 'server/models/user';
import { AppError } from '../../../../common-common/src/errors';
import { ServerCommunitiesController } from '../server_communities_controller';

export const Errors = {
  NotAdmin: 'Must be a site admin',
  ChainNotFound: 'Chain not found',
};

export type GetCommunityStatsOptions = {
  user: UserInstance;
  chainId: string;
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
  { user, chainId }: GetCommunityStatsOptions
): Promise<GetCommunityStatsResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const chain = await this.models.Chain.findByPk(chainId);
  if (!chain) {
    throw new AppError(Errors.ChainNotFound);
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
      chain: chainId,
    },
  });

  // Count for Threads
  const numThreadsLastMonth = await this.models.Thread.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      chain: chainId,
    },
  });

  // Count for Reactions
  const numReactionsLastMonth = await this.models.Reaction.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      chain: chainId,
    },
  });

  // Count for Votes
  const numProposalVotesLastMonth = await this.models.Vote.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      community_id: chainId,
    },
  });

  // Count for Polls
  const numPollsLastMonth = await this.models.Poll.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      chain_id: chainId,
    },
  });

  const numMembersLastMonth = await this.models.Address.count({
    where: {
      created_at: {
        [Op.gte]: oneMonthAgo,
      },
      community_id: chainId,
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
