import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoStage: 'Must pass in stage',
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  InvalidStage: 'Invalid stage',
};

const updateThreadStage = async (models, req: Request, res: Response, next: NextFunction) => {
  const { thread_id, stage } = req.body;
  if (!thread_id) return next(new Error(Errors.NoThreadId));
  if (!stage) return next(new Error(Errors.NoStage));
  if (!req.user) return next(new Error(Errors.NotAdminOrOwner));

  try {
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new Error(Errors.NoThread));
    const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
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
    let additionalStages = [];
    let entity;
    if (thread.community) {
      entity = await models.OffchainCommunity.findOne({ where: { id: thread.community } });
    } else if (thread.chain) {
      entity = await models.Chain.findOne({ where: { id: thread.chain } });
    }
    try {
      additionalStages = Array.from(JSON.parse(entity.additionalStages)).map(s => s.toString()).filter(s => s);
    } catch (e) {}

    // validate stage
    const availableStages = [
      'discussion', 'proposal_in_review', 'voting', 'passed', 'failed', ...additionalStages
    ];
    if (availableStages.indexOf(stage) === -1) {
      return next(new Error(Errors.InvalidStage));
    }

    await thread.update({ stage });

    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread_id, },
      include: [
        {
          model: models.Address,
          as: 'Address'
        },
        {
          model: models.Address,
          through: models.Collaboration,
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
