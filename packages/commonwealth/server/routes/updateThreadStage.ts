import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { AppError, ServerError } from '../util/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../models';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoStage: 'Must pass in stage',
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  InvalidStage: 'Please Select a Stage',
  FailedToParse: 'Failed to parse custom stages'
};

const updateThreadStage = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { thread_id, stage } = req.body;
  if (!thread_id) return next(new AppError(Errors.NoThreadId));
  if (!stage) return next(new AppError(Errors.NoStage));
  if (!req.user) return next(new AppError(Errors.NotAdminOrOwner));

  try {
    const thread = await models.Thread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new AppError(Errors.NoThread));
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
      if (!role) return next(new AppError(Errors.NotAdminOrOwner));
    }

    // fetch available stages
    let custom_stages = [];
    const entity = await models.Chain.findOne({ where: { id: thread.chain } });
    try {
      custom_stages = Array.from(JSON.parse(entity.custom_stages)).map((s) => s.toString()).filter((s) => s);
    } catch (e) {
      throw new AppError(Errors.FailedToParse);
    }

    // validate stage
    const availableStages = custom_stages.length === 0 ? [
      'discussion', 'proposal_in_review', 'voting', 'passed', 'failed',
    ] : custom_stages;

    if (availableStages.indexOf(stage) === -1) {
      return next(new AppError(Errors.InvalidStage));
    }

    await thread.update({ stage });

    const finalThread = await models.Thread.findOne({
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
        models.Attachment,
        {
          model: models.Topic,
          as: 'topic'
        }
      ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new ServerError(e));
  }
};

export default updateThreadStage;
