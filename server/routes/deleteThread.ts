import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import validateRoles from '../util/validateRoles';

const log = factory.getLogger(formatFilename(__filename));

enum DeleteThreadErrors {
  NoUser = 'Not logged in',
  NoThread = 'Must provide thread_id',
  NoPermission = 'Not owned by this user',
}

const deleteThread = async (
  models: DB,
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
      include: [models.Chain],
    });

    let thread = myThread;
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
