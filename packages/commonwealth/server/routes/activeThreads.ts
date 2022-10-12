import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { DB } from '../models';
import { AppError, ServerError } from '../util/errors';


const MIN_THREADS_PER_TOPIC = 0;
const MAX_THREADS_PER_TOPIC = 10;

const activeThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new AppError(error));

  let { threads_per_topic } = req.query;
  if (!threads_per_topic
    || Number.isNaN(threads_per_topic)
    || threads_per_topic < MIN_THREADS_PER_TOPIC
    || threads_per_topic > MAX_THREADS_PER_TOPIC) {
    threads_per_topic = 5;
  }

  const allThreads = [];
  const communityWhere = { chain_id: chain.id }
  const communityTopics = await models.Topic.findAll({
    where: communityWhere
  });

  const threadInclude = [
    { model: models.Address, as: 'Address', },
    { model: models.Address, as: 'collaborators',},
    { model: models.Topic, as: 'topic', },
    { model: models.LinkedThread, as: 'linked_threads' },
    { model: models.ChainEntity }
  ];

  await Promise.all(communityTopics.map(async (topic) => {
    const recentTopicThreads = await models.Thread.findAll({
      where: {
        topic_id: topic.id
      },
      include: threadInclude,
      limit: threads_per_topic,
      order: [['created_at', 'DESC'], ['last_commented_on', 'DESC']]
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

    allThreads.push(...(recentTopicThreads || []));
  })).catch((err) => {
    return next(new ServerError(err));
  });

  return res.json({
    status: 'Success',
    result: allThreads.map((c) => c.toJSON()),
  });
};

export default activeThreads;
