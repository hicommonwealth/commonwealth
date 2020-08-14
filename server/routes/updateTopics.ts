/* eslint-disable quotes */
import { Response, NextFunction } from 'express';

enum UpdateTopicsErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoAddr = 'Must provide address',
  NoTopic = 'Must provide topic_name',
  InvalidAddr = 'Invalid address',
  NoPermission = `You do not have permission to edit post's topics`
}

const updateTopics = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(UpdateTopicsErrors.NoUser));
  if (!req.body.thread_id) return next(new Error(UpdateTopicsErrors.NoThread));
  if (!req.body.address) return next(new Error(UpdateTopicsErrors.NoAddr));
  if (!req.body.topic_name) return next(new Error(UpdateTopicsErrors.NoTopic));

  const userAddresses = await req.user.getAddresses();
  const userAddress = userAddresses.find((a) => !!a.verified && a.address === req.body.address);
  if (!userAddress) return next(new Error(UpdateTopicsErrors.InvalidAddr));

  const thread = await models.OffchainThread.findOne({
    where: {
      id: req.body.thread_id,
    },
  });

  const roles: any[] = await models.Role.findAll({
    where: thread.community ? {
      permission: ['admin', 'moderator'],
      address_id: userAddress.id,
      offchain_community_id: thread.community,
    } : {
      permission: ['admin', 'moderator'],
      address_id: userAddress.id,
      chain_id: thread.chain,
    },
  });
  const isAdminOrMod = roles.length > 0;
  const isAuthor = (thread.address_id === userAddress.id);
  if (!isAdminOrMod && !isAuthor) {
    return next(new Error(UpdateTopicsErrors.NoPermission));
  }

  // remove deleted topics
  let newTopic;
  if (req.body.topic_id) {
    thread.topic_id = req.body.topic_id;
    await thread.save();
    newTopic = await models.OffchainTopic.findOne({
      where: { id: req.body.topic_id }
    });
  } else {
    [newTopic] = await models.OffchainTopic.findOrCreate({
      where: {
        name: req.body.topic_name,
        community_id: thread.community || null,
        chain_id: thread.community ? null : thread.chain,
      },
    });
    thread.topic_id = newTopic.id;
    await thread.save();
  }
  return res.json({ status: 'Success', result: newTopic });
};

export default updateTopics;
