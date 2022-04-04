/* eslint-disable quotes */
import { Response, NextFunction } from 'express';
import { DB } from '../database';

enum UpdateTopicErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoAddr = 'Must provide address',
  NoTopic = 'Must provide topic_name',
  InvalidAddr = 'Invalid address',
  NoPermission = `You do not have permission to edit post topic`,
}

const updateTopic = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new Error(UpdateTopicErrors.NoUser));
  if (!req.body.thread_id) return next(new Error(UpdateTopicErrors.NoThread));
  if (!req.body.address) return next(new Error(UpdateTopicErrors.NoAddr));
  if (!req.body.topic_name) return next(new Error(UpdateTopicErrors.NoTopic));

  const userAddresses = await req.user.getAddresses();
  const userAddress = userAddresses.find(
    (a) => !!a.verified && a.address === req.body.address
  );
  if (!userAddress) return next(new Error(UpdateTopicErrors.InvalidAddr));

  const thread = await models.OffchainThread.findOne({
    where: {
      id: req.body.thread_id,
    },
  });

  const roles: any[] = await models.Role.findAll({
    where: {
      permission: ['admin', 'moderator'],
      address_id: userAddress.id,
      chain_id: thread.chain,
    },
  });
  const isAdminOrMod = roles.length > 0;
  if (!isAdminOrMod) {
    return next(new Error(UpdateTopicErrors.NoPermission));
  }

  // remove deleted topics
  let newTopic;
  if (req.body.topic_id) {
    thread.topic_id = req.body.topic_id;
    await thread.save();
    newTopic = await models.OffchainTopic.findOne({
      where: { id: req.body.topic_id },
    });
  } else {
    [newTopic] = await models.OffchainTopic.findOrCreate({
      where: {
        name: req.body.topic_name,
        chain_id: thread.chain,
      },
    });
    thread.topic_id = newTopic.id;
    await thread.save();
  }
  return res.json({ status: 'Success', result: newTopic.toJSON() });
};

export default updateTopic;
