/* eslint-disable quotes */
import { Response, NextFunction } from 'express';
import { DB } from '../database';
import validateRoles from '../util/validateRoles';

enum OrderTopicsErrors {
  NoUser = 'Not logged in',
  NoIds = 'Must supply ordered array of topic IDs',
  NoChain = 'Must supply a chain ID',
  NoPermission = `You do not have permission to order topics`,
}

// TODO Graham 3/29/22: Add checks to ensure only featured tags are ordered

const OrderTopics = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new Error(OrderTopicsErrors.NoUser));

  const { chain } = req.body;
  if (!chain) return next(new Error(OrderTopicsErrors.NoChain));

  const isAdminOrMod = validateRoles(models, req, 'moderator', chain);
  if (!isAdminOrMod) return next(new Error(OrderTopicsErrors.NoPermission));

  const newTopicOrder = req.body['order[]'];
  if (!newTopicOrder) return next(new Error(OrderTopicsErrors.NoIds));

  // todo proper array handling
  const topics = [];
  for (let i = 0; i < newTopicOrder.length; i++) {
    const topic = await models.OffchainTopic.findOne({
      where: { id: newTopicOrder[i] },
    });
    topic.order = i + 1;
    topics.push(topic);
    await topic.save();
  }

  return res.json({ status: 'Success', result: topics.map((t) => t.toJSON()) });
};

export default OrderTopics;
