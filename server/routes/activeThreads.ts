import { Request, Response, NextFunction } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { OffchainCommentAttributes } from 'server/models/offchain_comment';
import {
  OffchainThreadAttributes,
  OffchainThreadInstance,
} from 'server/models/offchain_thread';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

const activeThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(
    models,
    req.query,
    req.user
  );
  if (error) return next(new Error(error));
  let { threads_per_topic } = req.query;
  if (!threads_per_topic || Number.isNaN(threads_per_topic) || threads_per_topic < 0 || threads_per_topic > 10) {
    threads_per_topic = 3;
  }

  try {
    const communityWhere = {};
    if (chain) communityWhere['chain_id'] = chain.id;
    else communityWhere['community_id'] = community.id;
    const communityTopics = await models.OffchainTopic.findAll({ where: communityWhere });
    const allThreads = [];
    console.log(communityTopics?.length);
    await Promise.all(communityTopics.map(async (topic) => {
      console.log(topic.id);
      const recentTopicThreads = await models.OffchainThread.findAll({
        where: {
          topic_id: topic.id,
        },
        limit: threads_per_topic,
        order: [['last_commented_on', 'DESC']]
      });
      allThreads.concat(recentTopicThreads);
    }));
    console.log({ length: allThreads.length });

    return res.json({
      status: 'Success',
      result: {
        threads: allThreads.map((c) => c.toJSON()),
      },
    });
  } catch (err) {
    return next(new Error(err));
  }

};

export default activeThreads;
