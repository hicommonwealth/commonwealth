import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';

export const Errors = {
  InsufficientPermissions:
    'Must be author, collaborator, admin or author to link',
  MustHaveLinkingThreadId: 'Must have linking thread id',
  MustHaveLinkedThreadId: 'Must have linked thread id',
  ThreadsMustShareCommunity: 'Threads do not share community or do not exist',
};

const updateLinkedThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));

  const { linked_thread_id, linking_thread_id, remove_link } = req.body;
  if (!linked_thread_id) {
    return next(new Error(Errors.MustHaveLinkedThreadId));
  }
  if (!linking_thread_id) {
    return next(new Error(Errors.MustHaveLinkingThreadId));
  }

  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new Error(authorError));

  const userOwnedAddresses = await req.user.getAddresses();
  const userOwnedAddressIds = userOwnedAddresses
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const isAuthor = await models.OffchainThread.findOne({
    where: {
      id: linking_thread_id,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
  });

  try {
    if (!isAuthor) {
      const collaboration = await models.Collaboration.findOne({
        where: {
          offchain_thread_id: linking_thread_id,
          address_id: { [Op.in]: userOwnedAddressIds },
        },
      });
      if (!collaboration) {
        const requesterIsAdminOrMod = await models.Role.findAll({
          where: {
            address_id: { [Op.in]: userOwnedAddressIds },
            permission: ['admin', 'moderator'],
          },
        });
        if (!requesterIsAdminOrMod) {
          return next(new Error(Errors.InsufficientPermissions));
        }
      }
    }

    const params = {
      linked_thread: linked_thread_id,
      linking_thread: linking_thread_id,
    };

    if (remove_link === 'true') {
      await models.LinkedThread.destroy({ where: params });
    } else {
      const linkedThread = await models.OffchainThread.findOne({
        where: { id: linked_thread_id },
      });
      const linkingThread = await models.OffchainThread.findOne({
        where: { id: linking_thread_id },
      });
      const threadsShareChain =
        linkedThread?.chain && linkedThread?.chain === linkingThread?.chain;
      if (threadsShareChain) {
        await models.LinkedThread.findOrCreate({ where: params });
      } else {
        return next(new Error(Errors.ThreadsMustShareCommunity));
      }
    }

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
          model: models.Reaction,
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
