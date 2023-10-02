import { ServerCommunitiesController } from '../server_communities_controller';
import { UserInstance } from 'server/models/user';
import { ChainInstance } from 'server/models/chain';
import { AppError } from '../../../../common-common/src/errors';
import { Op } from 'sequelize';

export const Errors = {
  NotAdmin: 'Must be a site admin',
};

type GetCommunityStatsOptions = {
  user: UserInstance;
  chain: ChainInstance;
};

type GetCommunityStatsResult = {
  numCommentsLastMonth: number;
  numThreadsLastMonth: number;
  numPollsLastMonth: number;
  numReactionsLastMonth: number;
  numProposalVotesLastMonth: number;
  numMembersLastMonth: number;
};

export async function __getCommunityNodes(
  this: ServerCommunitiesController,
  { user, chain }: GetCommunityStatsOptions
): Promise<GetCommunityStatsResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const chainId = chain.id;

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
      chain_id: chainId,
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
      chain: chainId,
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
