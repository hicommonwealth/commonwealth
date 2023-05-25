import { AppError, ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';

export const Errors = {
  NotAdmin: 'Not an admin',
  NoThread: 'Cannot find thread',
};

const updateThreadPinned = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { thread_id } = req.body;
  if (!thread_id) return next(new AppError(Errors.NoThread));

  try {
    const thread = await models.Thread.findOne({
      where: {
        id: thread_id,
      },
    });
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);

    // only community mods and admin can pin
    const role = await models.Address.findOne({
      where: {
        chain: thread.chain,
        id: { [Op.in]: userOwnedAddressIds },
        role: { [Op.in]: ['admin', 'moderator'] },
      },
      attributes: ['role'],
    });
    if (!role) return next(new AppError(Errors.NotAdmin));

    await thread.update({ pinned: !thread.pinned });

    const finalThread = await models.Thread.findOne({
      where: { id: thread.id },
      include: [
        {
          model: models.Address,
          as: 'Address',
        },
        {
          model: models.Address,
          // through: models.Collaboration,
          as: 'collaborators',
        },
        models.Attachment,
        {
          model: models.Topic,
          as: 'topic',
        },
      ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new ServerError(e));
  }
};

export default updateThreadPinned;
