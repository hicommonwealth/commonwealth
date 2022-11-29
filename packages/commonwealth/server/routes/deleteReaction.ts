import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { AppError, ServerError } from 'common-common/src/errors';
import { Action, PermissionError } from 'common-common/src/permissions';
import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { isAddressPermitted } from '../util/roles';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoReactionId: 'Must provide reaction ID',
  AddressNotOwned: 'Not owned by this user',
};

const deleteReaction = async (models: DB, banCache: BanCache, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.reaction_id) {
    return next(new AppError(Errors.NoReactionId));
  }

  try {
    const userOwnedAddressIds = (await req.user.getAddresses()).filter((addr) => !!addr.verified).map((addr) => addr.id);
    const reaction = await models.Reaction.findOne({
      where: {
        id: req.body.reaction_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [ models.Address ],
    });

    const permission_error = await isAddressPermitted(
      models,
      reaction.Address.id,
      reaction.chain,
      Action.DELETE_REACTION,
    );
    if (permission_error === PermissionError.NOT_PERMITTED) {
      return next(new AppError(PermissionError.NOT_PERMITTED));
    }

    // check if author can delete react
    if (reaction) {
      const [canInteract, banError] = await banCache.checkBan({
        chain: reaction.chain,
        address: reaction.Address.address,
      });
      if (!canInteract) {
        return next(new AppError(banError));
      }
    }

    // actually delete
    await reaction.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteReaction;
