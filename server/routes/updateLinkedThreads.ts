import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';

export const Errors = {
  MustBeAdminOrAuthor: 'Must be admin or author',
  MustHaveLinkingThreadId: 'Must have linking thread id',
  MustHaveLinkedThreadId: 'Must have linked thread id',
};

const updateLinkedThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(
    models,
    req.body,
    req.user
  );
  if (error) return next(new Error(error));
  const { linked_thread_id, linking_thread_id } = req.body;
  if (!linked_thread_id) {
    return next(new Error(Errors.MustHaveLinkedThreadId));
  }
  if (!linking_thread_id) {
    return next(new Error(Errors.MustHaveLinkingThreadId));
  }
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  try {
    if (authorError) {
      const adminAddress = await models.Address.findOne({
        where: {
          address: req.body.address,
          user_id: req.user.id,
        },
      });
      const requesterIsAdminOrMod = await models.Role.findAll({
        where: {
          address_id: adminAddress.id,
          permission: ['admin', 'moderator'],
        },
      });
      if (!requesterIsAdminOrMod) {
        return next(new Error(Errors.MustBeAdminOrAuthor));
      }
    }

    // TODO: findOrCreate, add unique constraint to linked & linking
    // thread cols in LT table
    await models.LinkedThread.create({
      linked_thread: linked_thread_id,
      linking_thread: linking_thread_id,
    });
    const finalThread = await models.OffchainThread.findOne({
      where: {
        id: linking_thread_id,
      },
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
        {
          model: models.OffchainTopic,
          as: 'topic',
        },
        {
          model: models.ChainEntity,
        },
        {
          model: models.OffchainReaction,
          as: 'reactions',
          include: [
            {
              model: models.Address,
              as: 'Address',
              required: true,
            },
          ],
        },
        {
          model: models.LinkedThread,
          as: 'linked_threads',
        },
      ],
    });
    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default updateLinkedThreads;