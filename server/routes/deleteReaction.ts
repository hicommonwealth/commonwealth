import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import log from '../../shared/logging';
import { DB } from '../database';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoReactionId: 'Must provide reaction ID',
  AddressNotOwned: 'Not owned by this user',
};

const deleteReaction = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.reaction_id) {
    return next(new Error(Errors.NoReactionId));
  }

  try {
    const userOwnedAddressIds = (await req.user.getAddresses()).filter((addr) => !!addr.verified).map((addr) => addr.id);
    const reaction = await models.OffchainReaction.findOne({
      where: {
        id: req.body.reaction_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [ models.Address ],
    });
    // actually delete
    await reaction.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteReaction;
