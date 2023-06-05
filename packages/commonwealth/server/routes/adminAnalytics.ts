import { QueryTypes } from 'sequelize';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { AppError } from 'common-common/src/errors';
import { success } from '../types';

export const Errors = {
  NotAdmin: 'Must be a site admin',
};

type AdminAnalyticsReq = {};

type AdminAnalyticsResp = {
  lastMonthNewCommunties: Array<string>;
  communityStats: Array<{
    communityName: string;
    chain: string;
    numCommentsLastMonth: number;
    numThreadsLastMonth: number;
    numPollsLastMonth: number;
    numReactionsLastMonth: number;
    numProposalVotesLastMonth: number;
    numMembersLastMonth: number;
  }>;
  totalStats: {
    numCommentsLastMonth: number;
    numThreadsLastMonth: number;
    numPollsLastMonth: number;
    numReactionsLastMonth: number;
    numProposalVotesLastMonth: number;
    numMembersLastMonth: number;
  };
};

const adminAnalytics = async (
  models: DB,
  req: TypedRequestBody<AdminAnalyticsReq>,
  res: TypedResponse<AdminAnalyticsResp>
) => {
  if (!req.user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  // New Communities
  const newCommunites: Array<{ id: string }> = await models.sequelize.query(
    `SELECT id FROM "Chains" WHERE created_at >= NOW() - INTERVAL '30 days'`,
    { type: QueryTypes.SELECT }
  );

  // Community Stats
  const communityStats: Array<{
    communityName: string;
    chain: string;
    numCommentsLastMonth: number;
    numThreadsLastMonth: number;
    numPollsLastMonth: number;
    numReactionsLastMonth: number;
    numProposalVotesLastMonth: number;
    numMembersLastMonth: number;
  }> = await models.sequelize.query(
    `SELECT 
    Chains.name as "communityName",
    Chains.id as chain,
    COUNT(DISTINCT Comments.id)::integer AS "numCommentsLastMonth",
    COUNT(DISTINCT Threads.id)::integer AS "numThreadsLastMonth",
    COUNT(DISTINCT Reactions.id)::integer AS "numMembersLastMonth",
    COUNT(DISTINCT Votes.id)::integer AS "numProposalVotesLastMonth",
    COUNT(DISTINCT Polls.id)::integer AS "numPollsLastMonth",
    COUNT(DISTINCT RoleAssignments.id)::integer AS "numMembersLastMonth"
    FROM 
        "Chains" Chains
    LEFT JOIN 
        "Comments" Comments ON Chains.id = Comments.chain AND Comments.created_at >= NOW() - INTERVAL '30 days'
    LEFT JOIN 
        "Threads" Threads ON Chains.id = Threads.chain AND Threads.created_at >= NOW() - INTERVAL '30 days'
    LEFT JOIN 
        "Reactions" Reactions ON Chains.id = Reactions.chain AND Reactions.created_at >= NOW() - INTERVAL '30 days'
    LEFT JOIN 
        "Votes" Votes ON Chains.id = Votes.chain_id AND Votes.created_at >= NOW() - INTERVAL '30 days'
    LEFT JOIN 
        "Polls" Polls ON Chains.id = Polls.chain_id AND Polls.created_at >= NOW() - INTERVAL '30 days'
    LEFT JOIN 
        "CommunityRoles" CommunityRoles ON Chains.id = CommunityRoles.chain_id
    LEFT JOIN 
        "RoleAssignments" RoleAssignments ON CommunityRoles.id = RoleAssignments.community_role_id AND RoleAssignments.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY 
        Chains.id;
    `,
    { type: QueryTypes.SELECT }
  );

  // Sum across all communities via communityStats
  const totalStats = communityStats.reduce(
    (acc, curr) => {
      acc.numCommentsLastMonth += curr.numCommentsLastMonth;
      acc.numThreadsLastMonth += curr.numThreadsLastMonth;
      acc.numMembersLastMonth += curr.numMembersLastMonth;
      acc.numReactionsLastMonth += curr.numReactionsLastMonth;
      acc.numProposalVotesLastMonth += curr.numProposalVotesLastMonth;
      return acc;
    },
    {
      numCommentsLastMonth: 0,
      numThreadsLastMonth: 0,
      numMembersLastMonth: 0,
      numReactionsLastMonth: 0,
      numProposalVotesLastMonth: 0,
    }
  );

  return success(res, {
    lastMonthNewCommunties: newCommunites.map((c) => c.id),
    communityStats: communityStats,
    totalStats: totalStats,
  });
};

export default adminAnalytics;
