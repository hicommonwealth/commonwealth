/* eslint-disable quotes */
import { AppError, ServerError } from 'common-common/src/errors';
import type { NextFunction, Response } from 'express';
import type { TopicInstance } from 'server/models/topic';
import type { DB } from '../models';
import { validateOwner } from '../util/validateOwner';

enum OrderTopicsErrors {
  NoUser = 'Not signed in',
  NoIds = 'Must supply ordered array of topic IDs',
  NoCommunity = 'Must supply a community ID',
  NoPermission = `You do not have permission to order topics`,
  InvalidTopic = 'Passed topics may not all be featured, or may include an invalid ID',
}

// TODO Graham 3/29/22: Add checks to ensure only featured tags are ordered

const OrderTopics = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError(OrderTopicsErrors.NoUser));
  }

  const { community } = req;

  const isAdminOrMod = await validateOwner({
    models: models,
    user: req.user,
    communityId: community.id,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdminOrMod) {
    return next(new AppError(OrderTopicsErrors.NoPermission));
  }

  const newTopicOrder: string[] = req.body.orderedIds;

  if (!newTopicOrder?.length) {
    return res.json({
      status: 'Success',
    });
  }

  try {
    const topics: TopicInstance[] = await Promise.all(
      newTopicOrder.map((id: string, idx: number) => {
        return (async () => {
          const topic = await models.Topic.findOne({
            where: { id, featured_in_sidebar: true },
          });
          if (!topic) {
            throw new AppError(OrderTopicsErrors.InvalidTopic);
          }
          topic.order = idx + 1;
          await topic.save();
          return topic;
        })();
      }),
    );

    return res.json({
      status: 'Success',
      result: topics.map((t) => t.toJSON()),
    });
  } catch (err) {
    return next(new ServerError(err));
  }
};

export default OrderTopics;
