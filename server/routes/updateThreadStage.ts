import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoStageId: 'Must provide stage_id',
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  InvalidStage: 'Invalid stage',
};

const updateThreadStage = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { thread_id, stage_id } = req.body;
  if (!thread_id) return next(new Error(Errors.NoThreadId));
  if (!stage_id) return next(new Error(Errors.NoStageId));
  if (!req.user) return next(new Error(Errors.NotAdminOrOwner));

  try {
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new Error(Errors.NoThread));
    const userOwnedAddressIds = (await req.user.getAddresses()).filter((addr) => !!addr.verified).map((addr) => addr.id);
    if (!userOwnedAddressIds.includes(thread.address_id)) { // is not author
      const roles = await models.Role.findAll({
        where: {
          address_id: { [Op.in]: userOwnedAddressIds, },
          permission: { [Op.in]: ['admin', 'moderator'] },
        }
      });
      const role = roles.find((r) => {
        return r.offchain_community_id === thread.community || r.chain_id === thread.chain;
      });
      if (!role) return next(new Error(Errors.NotAdminOrOwner));
    }

    // fetch available stages
    let available = null;
    if (thread.community) {
      available = await models.OffchainStage.findAll({ where: { community_id: thread.community, id: stage_id } });
    } else if (thread.chain) {
      available = await models.OffchainStage.findAll({ where: { chain_id: thread.chain, id: stage_id } });
    }

    if (!available) {
      return next(new Error(Errors.InvalidStage));
    }

    await thread.update({ stage_id });

    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread_id, },
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

export default updateThreadStage;
