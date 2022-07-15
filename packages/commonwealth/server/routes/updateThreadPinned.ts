import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotAdmin: 'Not an admin',
  NoThread: 'Cannot find thread',
};

const updateThreadPinned = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { thread_id } = req.body;
  if (!thread_id) return next(new Error(Errors.NoThread));

  try {
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
      },
    });
    const userOwnedAddressIds = (await req.user.getAddresses()).filter((addr) => !!addr.verified).map((addr) => addr.id);

    // only community mods and admin can pin
    const roles = await models.Role.findAll({
      where: {
        address_id: { [Op.in]: userOwnedAddressIds, },
        permission: { [Op.in]: ['admin', 'moderator'] },
      }
    });
    const role = roles.find((r) => {
      return r.chain_id === thread.chain;
    });
    if (!role) return next(new Error(Errors.NotAdmin));

    await thread.update({ pinned: !thread.pinned });

    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id, },
      include: [
        {
          model: models.Address,
          as: 'Address'
        },
        {
          model: models.Address,
          // through: models.Collaboration,
          as: 'collaborators'
        },
        models.OffchainAttachment,
        {
          model: models.OffchainTopic,
          as: 'topic'
        }
      ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default updateThreadPinned;
