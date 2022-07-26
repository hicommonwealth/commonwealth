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
  NoThreadId = 'Must provide thread_id',
  NoThread = 'The thread id does not exists',
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
    throw new AppError(DeleteThreadErrors.NoThreadId);
  }

  try {
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);

    const myThread = await models.OffchainThread.findOne({
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

      thread = await models.OffchainThread.findOne({
        where: {
          id: req.body.thread_id,
        },
        include: [models.Chain],
      });

      if (!thread) {
        // TODO: this should be an AppError since admin tried to delete non-existent thread, no?
        throw new AppError(DeleteThreadErrors.NoThread);
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
    // we catch a few app errors here that should not be reported as ServerErrors
    if (e instanceof AppError) throw new AppError(e.message);
    else throw new ServerError(e.message);
  }
};

export default deleteThread;
