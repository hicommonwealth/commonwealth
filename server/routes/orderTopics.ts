/* eslint-disable quotes */
import { Response, NextFunction } from 'express';
import { OffchainTopicInstance } from 'server/models/offchain_topic';
import validateChain from '../util/validateChain';
import validateRoles from '../util/validateRoles';
import { DB } from '../database';

enum OrderTopicsErrors {
  NoUser = 'Not logged in',
  NoIds = 'Must supply ordered array of topic IDs',
  NoChain = 'Must supply a chain ID',
  NoPermission = `You do not have permission to order topics`,
  InvalidTopic = 'Passed topics may not all be featured, or may include an invalid ID',
}

// TODO Graham 3/29/22: Add checks to ensure only featured tags are ordered

const OrderTopics = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));

  if (!req.user) return next(new Error(OrderTopicsErrors.NoUser));
  const isAdminOrMod = await validateRoles(models, req, 'moderator', chain.id);
  if (!isAdminOrMod) return next(new Error(OrderTopicsErrors.NoPermission));

  const newTopicOrder: string[] = req.body['order[]'];
  if (!newTopicOrder || newTopicOrder.length === 0) {
    return next(new Error(OrderTopicsErrors.NoIds));
  }

  try {
    const topics: OffchainTopicInstance[] = await Promise.all(
      newTopicOrder.map((id: string, idx: number) => {
        return (async () => {
          const topic = await models.OffchainTopic.findOne({
            where: { id, featured_in_sidebar: true },
          });
          if (!topic) {
            throw new Error(OrderTopicsErrors.InvalidTopic);
          }
          topic.order = idx + 1;
          await topic.save();
          return topic;
        })();
      })
    );

    return res.json({
      status: 'Success',
      result: topics.map((t) => t.toJSON()),
    });
  } catch (err) {
    return next(new Error(err));
  }
};

export default OrderTopics;
