/* eslint-disable quotes */
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';

enum UpdateTopicErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoAddr = 'Must provide address',
  NoTopic = 'Must provide topic_name or topic_id',
  InvalidAddr = 'Invalid address',
  NoPermission = `You do not have permission to edit post topic`,
}

const updateTopic = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError(UpdateTopicErrors.NoUser));
  if (!req.body.thread_id)
    return next(new AppError(UpdateTopicErrors.NoThread));
  if (!req.body.address) return next(new AppError(UpdateTopicErrors.NoAddr));
  if (!req.body.topic_name && !req.body.topic_id)
    return next(new AppError(UpdateTopicErrors.NoTopic));

  const userAddresses = await req.user.getAddresses();
  const userAddressIds = userAddresses
    .filter((a) => !!a.verified)
    .map((a) => a.id);

  if (userAddressIds.length === 0) {
    return next(new AppError(UpdateTopicErrors.InvalidAddr));
  }

  const thread = await models.Thread.findOne({
    where: {
      id: req.body.thread_id,
    },
  });

  const isAdminOrMod = await models.Address.findOne({
    where: {
      chain: thread.chain,
      id: { [Op.in]: userAddressIds },
      role: { [Op.in]: ['admin', 'moderator'] },
    },
    attributes: ['role'],
  });

  if (!isAdminOrMod) {
    const isAuthor = await models.Thread.findOne({
      where: {
        id: req.body.thread_id,
        address_id: { [Op.in]: userAddressIds },
      },
    });

    if (!isAuthor) {
      return next(new AppError(UpdateTopicErrors.NoPermission));
    }
  }

  // remove deleted topics
  let newTopic;
  if (req.body.topic_id) {
    thread.topic_id = req.body.topic_id;
    await thread.save();
    newTopic = await models.Topic.findOne({
      where: { id: req.body.topic_id },
    });
  } else {
    [newTopic] = await models.Topic.findOrCreate({
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
