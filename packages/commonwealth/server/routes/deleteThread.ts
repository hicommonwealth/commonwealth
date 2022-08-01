import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { AppError, ServerError } from '../util/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';
import BanCache from '../util/banCheckCache';
import validateRoles from '../util/validateRoles';

const log = factory.getLogger(formatFilename(__filename));

enum DeleteThreadErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoPermission = 'Not owned by this user',
}

const deleteThread = async (
  models: DB,
  banCache: BanCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { thread_id, chain_id } = req.body;
  if (!req.user) {
    throw new AppError(DeleteThreadErrors.NoUser);
  }
  if (!thread_id) {
    throw new AppError(DeleteThreadErrors.NoThread);
  }

  try {
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);

    const myThread = await models.Thread.findOne({
      where: {
        id: req.body.thread_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [{
        model: models.Chain,
      }, {
        association: 'Address',
      }],
    });

    let thread = myThread;

    // check if author can delete post
    if (thread) {
      const [canInteract, error] = await banCache.checkBan({
        chain: thread.chain,
        address: thread.Address.address,
      });
      if (!canInteract) {
        throw new AppError(error);
      }
    }

    if (!myThread) {
      const isAdminOrMod = await validateRoles(models, req.user, 'moderator', chain_id);

      if (!isAdminOrMod) {
        throw new AppError(DeleteThreadErrors.NoPermission);
      }

      thread = await models.Thread.findOne({
        where: {
          id: req.body.thread_id,
        },
        include: [models.Chain],
      });

      if (!thread) {
        throw new ServerError(DeleteThreadErrors.NoThread);
      }
    }

    // find and delete all associated subscriptions
    await models.Subscription.destroy({
      where: {
        offchain_thread_id: thread.id,
      },
    });

    await thread.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    throw new ServerError(e);
  }
};

export default deleteThread;
