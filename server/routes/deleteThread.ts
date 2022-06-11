import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
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
    return next(new Error(DeleteThreadErrors.NoUser));
  }
  if (!thread_id) {
    return next(new Error(DeleteThreadErrors.NoThread));
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
        return next(new Error(error));
      }
    }

    if (!myThread) {
      const isAdminOrMod = validateRoles(models, req.user, 'moderator', chain_id);

      if (!isAdminOrMod) {
        return next(new Error(DeleteThreadErrors.NoPermission));
      }

      thread = await models.OffchainThread.findOne({
        where: {
          id: req.body.thread_id,
        },
        include: [models.Chain],
      });

      if (!thread) {
        return next(new Error(DeleteThreadErrors.NoThread));
      }
    }

    const topic = await models.OffchainTopic.findOne({
      where: { id: thread.topic_id },
      include: [{ model: models.OffchainThread, as: 'threads' }],
    });

    // find and delete all associated subscriptions
    const subscriptions = await models.Subscription.findAll({
      where: {
        offchain_thread_id: thread.id,
      },
    });
    await Promise.all(
      subscriptions.map((s) => {
        return s.destroy();
      })
    );

    await thread.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteThread;
