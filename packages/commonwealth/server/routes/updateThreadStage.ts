import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { ServerError } from '../util/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoStage: 'Must pass in stage',
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  InvalidStage: 'Please Select a Stage',
};

const updateThreadStage = async (models: DB, req: Request, res: Response, next: NextFunction) => {
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
    const userOwnedAddressIds = (await req.user.getAddresses()).filter((addr) => !!addr.verified).map((addr) => addr.id);
    if (!userOwnedAddressIds.includes(thread.address_id)) { // is not author
      const roles = await models.Role.findAll({
        where: {
          address_id: { [Op.in]: userOwnedAddressIds, },
          permission: { [Op.in]: ['admin', 'moderator'] },
        }
      });
      const role = roles.find((r) => {
        return r.chain_id === thread.chain;
      });
      if (!role) return next(new Error(Errors.NotAdminOrOwner));
    }

    // fetch available stages
    let custom_stages = [];
    const entity = await models.Chain.findOne({ where: { id: thread.chain } });
    try {
      custom_stages = Array.from(JSON.parse(entity.custom_stages)).map((s) => s.toString()).filter((s) => s);
    } catch (e) {
      throw new ServerError("Could not parse", e)
    }

    // validate stage
    const availableStages = custom_stages.length === 0 ? [
      'discussion', 'proposal_in_review', 'voting', 'passed', 'failed',
    ] : custom_stages;

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
