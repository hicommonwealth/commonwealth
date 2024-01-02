import { AppError } from 'common-common/src/errors';
import { Op, QueryTypes } from 'sequelize';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NotAdmin: 'Must be a site admin',
};

type AdminAnalyticsReq = {};

type AdminAnalyticsResp = {
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

const adminAnalytics = async (
  models: DB,
  req: TypedRequestBody<AdminAnalyticsReq>,
  res: TypedResponse<AdminAnalyticsResp>,
) => {
  if (!req.user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  try {
    // New Communities
    const newCommunites: Array<{ id: string }> = await models.sequelize.query(
      `SELECT id FROM "Communities" WHERE created_at >= NOW() - INTERVAL '30 days'`,
      { type: QueryTypes.SELECT },
    );

    // Community Stats
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    // Count for Comments
    const numCommentsLastMonth = await models.Comment.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo,
        },
      },
    });

    // Count for Threads
    const numThreadsLastMonth = await models.Thread.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo,
        },
      },
    });

    // Count for Reactions
    const numReactionsLastMonth = await models.Reaction.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo,
        },
      },
    });

    // Count for Votes
    const numProposalVotesLastMonth = await models.Vote.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo,
        },
      },
    });

    // Count for Polls
    const numPollsLastMonth = await models.Poll.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo,
        },
      },
    });

    const numMembersLastMonth = await models.User.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo,
        },
      },
    });

    const numGroupsLastMonth = await models.Group.count({
      where: {
        created_at: {
          [Op.gte]: oneMonthAgo,
        },
      },
    });

    // Aggregate results
    const totalStats = {
      numCommentsLastMonth,
      numThreadsLastMonth,
      numReactionsLastMonth,
      numProposalVotesLastMonth,
      numPollsLastMonth,
      numMembersLastMonth,
      numGroupsLastMonth,
    };

    return success(res, {
      lastMonthNewCommunities: newCommunites.map((c) => c.id),
      totalStats: totalStats,
    });
  } catch (e) {
    console.log(e);
    throw new AppError(e);
  }
};

export default adminAnalytics;
