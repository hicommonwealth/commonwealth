import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoReadOnly: 'Must pass in read_only',
  NoThread: 'Cannot find thread',
  NotAdmin: 'Not an admin',
};

const updateThreadPrivacy = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { thread_id, read_only } = req.body;
  if (!thread_id) return next(new Error(Errors.NoThreadId));
  if (!read_only) return next(new Error(Errors.NoReadOnly));

  try {
    const thread = await models.Thread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new Error(Errors.NoThread));
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    if (!userOwnedAddressIds.includes(thread.address_id)) {
      // is not author
      const roles = await models.Role.findAll({
        where: {
          address_id: { [Op.in]: userOwnedAddressIds },
          permission: { [Op.in]: ['admin', 'moderator'] },
        },
      });
      const role = roles.find((r) => {
        return (
          r.chain_id === thread.chain
        );
      });
      if (!role) return next(new Error(Errors.NotAdmin));
    }

    await thread.update({ read_only });

    const finalThread = await models.Thread.findOne({
      where: { id: thread_id },
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
        models.OffchainAttachment,
        {
          model: models.OffchainTopic,
          as: 'topic',
        },
      ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default updateThreadPrivacy;
