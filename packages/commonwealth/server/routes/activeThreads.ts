import { ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import getThreadsWithCommentCount from '../util/getThreadCommentsCount';

const MIN_THREADS_PER_TOPIC = 0;
const MAX_THREADS_PER_TOPIC = 10;

const activeThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const allThreads = [];
  try {
    let { threads_per_topic } = req.query;
    if (
      !threads_per_topic ||
      Number.isNaN(threads_per_topic) ||
      threads_per_topic < MIN_THREADS_PER_TOPIC ||
      threads_per_topic > MAX_THREADS_PER_TOPIC
    ) {
      threads_per_topic = 3;
    }

    const chain = req.chain;

    const communityWhere = { chain_id: chain.id };
    const communityTopics = await models.Topic.findAll({
      where: communityWhere,
    });

    const threadInclude = [
      { model: models.Address, as: 'Address' },
      { model: models.Address, as: 'collaborators' },
      { model: models.Topic, as: 'topic', required: true },
    ];

    let allRecentTopicThreadsRaw = [];
    allRecentTopicThreadsRaw = await Promise.all(
      communityTopics.map(async (topic) => {
        return await models.Thread.findAll({
          where: {
            topic_id: topic.id,
          },
          include: threadInclude,
          limit: threads_per_topic,
          order: [
            ['created_at', 'DESC'],
            ['last_commented_on', 'DESC'],
          ],
        });
      })
    );

    allRecentTopicThreadsRaw = allRecentTopicThreadsRaw.flat();

    const allRecentTopicThreads = allRecentTopicThreadsRaw.map((t) => {
      return t.toJSON();
    });

    const allThreadsWithCommentsCount = await getThreadsWithCommentCount({
      threads: allRecentTopicThreads,
      models,
      chainId: chain.id,
    });

    communityTopics.map(async (topic) => {
      const threadsWithCommentsCount = allThreadsWithCommentsCount.filter(
        (thread) => thread.topic_id === topic.id
      );

      allThreads.push(...(threadsWithCommentsCount || []));
    });
  } catch (err) {
    return next(new ServerError(err));
  }

  return res.json({
    status: 'Success',
    result: allThreads,
  });
};

export default activeThreads;
