/* eslint-disable quotes */
import { Response, NextFunction } from 'express';
import { DB } from '../database';

enum UpdateStageErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoAddr = 'Must provide address',
  InvalidAddr = 'Invalid address',
  NoPermission = `You do not have permission to edit post's stage`
}

const updateStages = async (models: DB, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(UpdateStageErrors.NoUser));
  if (!req.body.thread_id) return next(new Error(UpdateStageErrors.NoThread));
  if (!req.body.address) return next(new Error(UpdateStageErrors.NoAddr));

  const userAddresses = await req.user.getAddresses();
  const userAddress = userAddresses.find((a) => !!a.verified && a.address === req.body.address);
  if (!userAddress) return next(new Error(UpdateStageErrors.InvalidAddr));

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
  // const isAuthor = (thread.address_id === userAddress.id);
  if (!isAdminOrMod) {
    return next(new Error(UpdateStageErrors.NoPermission));
  }

  // remove deleted stages
  let newStage;
  if (req.body.stage_id) {
    thread.stage_id = req.body.stage_id;
    await thread.save();
    newStage = await models.OffchainStage.findOne({
      where: { id: req.body.stage_id }
    });
  } else {
    [newStage] = await models.OffchainStage.findOrCreate({
      where: {
        name: req.body.stage_name,
        community_id: thread.community || null,
        chain_id: thread.community ? null : thread.chain,
      },
    });
    thread.stage_id = newStage.id;
    await thread.save();
  }
  return res.json({ status: 'Success', result: newStage.toJSON() });
};

export default updateStages;
