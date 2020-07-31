import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { NotificationCategories, ProposalType } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  PrivateOrReadOnly: 'Must pass in read_only or privacy',
  NoThread: 'Cannot find thread',
  NotAdmin: 'Not an admin',
};

const setPrivacy = async (models, req: Request, res: Response, next: NextFunction) => {
  const { thread_id, read_only, privacy } = req.body;
  if (!read_only && !privacy) return next(new Error(Errors.PrivateOrReadOnly));

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
      const role = userRoles.find((r) => 
        r.offchain_community_id === thread.community || r.chain_id === thread.chain
      );
      if (!role) return next(new Error(Errors.NotAdmin));  
    }
    
    if (read_only) thread.read_only = read_only;
    // threads can be changed from private to public, but not the other way around
    if (thread.private) thread.private = privacy;
    await thread.save();
    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread_id, },
      include: [ models.Address, models.OffchainAttachment, { model: models.OffchainTag, as: 'tag' } ],
    })

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }

  // Todo: dispatch notifications conditional on a new mention
};

export default setPrivacy;
