import type { DB } from '../models';
import { ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import getThreadsWithCommentCount from '../util/getThreadCommentsCount';

const MIN_THREADS_PER_TOPIC = 0;
const MAX_THREADS_PER_TOPIC = 10;

const activeThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
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

  const allThreads = [];
  const communityWhere = { chain_id: chain.id };
  const communityTopics = await models.Topic.findAll({
    where: communityWhere,
  });

  const threadInclude = [
    { model: models.Address, as: 'Address' },
    { model: models.Address, as: 'collaborators' },
    { model: models.Topic, as: 'topic', required: true },
    { model: models.LinkedThread, as: 'linked_threads' },
    { model: models.ChainEntityMeta, as: 'chain_entity_meta' },
  ];

  await Promise.all(
    communityTopics.map(async (topic) => {
      const recentTopicThreadsRaw = await models.Thread.findAll({
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

      const recentTopicThreads = recentTopicThreadsRaw.map((t) => {
        return t.toJSON();
      });

      const threadsWithCommentsCount = await getThreadsWithCommentCount({
        threads: recentTopicThreads,
        models,
        chainId: chain.id,
      });

      // In absence of X threads with recent activity (comments),
      // commentless threads are fetched and included as active
      // if (!recentTopicThreads || recentTopicThreads.length < threads_per_topic) {
      //   const commentlessTopicThreads = await models.OffchainThread.findAll({
      //     where: {
      //       topic_id: topic.id,
      //       last_commented_on: {
      //         [Op.is]: null,
      //       }
      //     },
      //     include: threadInclude,
      //     limit: threads_per_topic - (recentTopicThreads || []).length,
      //     order: [['created_at', 'DESC']]
      //   });

      //   recentTopicThreads.push(...(commentlessTopicThreads || []));
      // }

      allThreads.push(...(threadsWithCommentsCount || []));
    })
  ).catch((err) => {
    return next(new ServerError(err));
  });

  return res.json({
    status: 'Success',
    result: allThreads,
  });
};

export default activeThreads;
