import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoReadOnly: 'Must pass in read_only',
  NoThread: 'Cannot find thread',
  NotAdmin: 'Not an admin',
};

const setPrivacy = async (models, req: Request, res: Response, next: NextFunction) => {
  const { thread_id, read_only } = req.body;
  if (!read_only) return next(new Error(Errors.NoReadOnly));

  if (!thread_id) {
    return next(new Error(Errors.NoThreadId));
  }

  try {
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new Error(Errors.NoThread));
    const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    if (!userOwnedAddressIds.includes(thread.address_id)) { // is not author
      const userRoles = await models.Role.findAll({
        where: {
          address_id: { [Op.in]: userOwnedAddressIds, },
        }
      });
      const role = userRoles.find((r) => {
        return r.offchain_community_id === thread.community || r.chain_id === thread.chain;
      });
      if (!role) return next(new Error(Errors.NotAdmin));
    }

    if (read_only) thread.read_only = read_only;
    await thread.save();

    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread_id, },
      include: [ models.Address, models.OffchainAttachment, { model: models.OffchainTopic, as: 'topic' } ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default setPrivacy;
