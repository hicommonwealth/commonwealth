import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';

export const Errors = {
  MustBeAdminOrAuthor: 'Must be admin or author',
  MustHaveLinkingThreadId: 'Must have linking thread id',
  MustHaveLinkedThreadId: 'Must have linked thread id',
  ThreadsMustShareCommunity: 'Threads do not share community or do not exist'
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

    const params = {
      linked_thread: linked_thread_id,
      linking_thread: linking_thread_id,
    }

    if (remove_link === 'true') {
      await models.LinkedThread.destroy({ where: params })
    } else {
      const linkedThread = await models.OffchainThread.findOne({
        where: { id: linked_thread_id }
      });
      const linkingThread = await models.OffchainThread.findOne({
        where: { id: linking_thread_id }
      });
      const threadsShareChain = linkedThread?.chain && linkedThread?.chain === linkingThread?.chain;
      const threadsShareCommunity = linkedThread?.community && linkedThread?.community === linkingThread?.community;
      if (threadsShareChain || threadsShareCommunity) {
        await models.LinkedThread.findOrCreate({ where: params });
      } else {
        return next(new Error(Errors.ThreadsMustShareCommunity));
      }
    }

    await models.OffchainThread.findOne({
      where: {
        id: linking_thread_id
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
    })
    return res.json({ status: 'Success', result: null }); // linkedThreadsFull.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default updateLinkedThreads;