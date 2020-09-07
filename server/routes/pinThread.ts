import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';

import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  MustBeAdmin: 'Must be admin or mod',
  NeedThread: 'Must provide thread',
};

const pinThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const { thread_id } = req.body;
  if (!thread_id) return next(new Error(Errors.NeedThread));

  try {
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
      },
    });
    const user = await models.User.findOne({
      where: {
        id: req.user.id,
      },
    });
    const userAddressIds = await user.getAddresses().map((a) => a.id);
    const roles = await models.Role.findAll({
      where: {
        address_id: { [Op.in]: userAddressIds, },
        permission: { [Op.in]: ['admin', 'moderator'], },
      },
    });

    const adminRoles = roles.filter((r) => ['admin', 'moderator'].includes(r.permission));
    const roleCommunities = adminRoles.map((r) => r.offchain_community_id || r.chain_id);
    const isAdminOfCommunity = roleCommunities.includes(thread.community);
    const isAdminOfChain = roleCommunities.includes(thread.chain);
    if (!isAdminOfCommunity && !isAdminOfChain) return next(new Error(Errors.MustBeAdmin));

    await thread.update({ pinned: !thread.pinned });

    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id, },
      include: [ models.Address, models.OffchainAttachment, { model: models.OffchainTopic, as: 'topic' } ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default pinThread;
