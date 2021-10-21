import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { Op } from 'sequelize';

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
  const { linked_thread_id, linking_thread_id, remove_link } = req.body;
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

    if (remove_link === 'true') {
      await models.LinkedThread.destroy({
        where: {
          linked_thread: linked_thread_id,
          linking_thread: linking_thread_id,
        }
      })
    } else {
      await models.LinkedThread.findOrCreate({
        where: {
          linked_thread: linked_thread_id,
          linking_thread: linking_thread_id,
        }
      });
    }

    const linkedThreads = await models.LinkedThread.findAll({
      where: { linking_thread: linking_thread_id },
    })
    const linkedThreadIds = linkedThreads.map((thread) => thread.linked_thread);
    const linkedThreadsFull = await models.OffchainThread.findOne({
      where: {
        id: {
          [Op.in]: linkedThreadIds,
        }
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
    return res.json({ status: 'Success', result: linkedThreadsFull.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default updateLinkedThreads;