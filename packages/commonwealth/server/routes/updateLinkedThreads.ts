import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { AppError, ServerError } from 'common-common/src/errors';

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
  if (error) return next(new AppError(error));

  const { linked_thread_id, linking_thread_id, remove_link } = req.body;
  if (!linked_thread_id) {
    return next(new AppError(Errors.MustHaveLinkedThreadId));
  }
  if (!linking_thread_id) {
    return next(new AppError(Errors.MustHaveLinkingThreadId));
  }

  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new AppError(authorError));

  const userOwnedAddresses = await req.user.getAddresses();
  const userOwnedAddressIds = userOwnedAddresses
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const isAuthor = await models.Thread.findOne({
    where: {
      id: linking_thread_id,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
  });

  try {
    if (!isAuthor) {
      const collaboration = await models.Collaboration.findOne({
        where: {
          thread_id: linking_thread_id,
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
          return next(new AppError(Errors.InsufficientPermissions));
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
      const linkedThread = await models.Thread.findOne({
        where: { id: linked_thread_id },
      });
      const linkingThread = await models.Thread.findOne({
        where: { id: linking_thread_id },
      });
      const threadsShareChain =
        linkedThread?.chain && linkedThread?.chain === linkingThread?.chain;
      if (threadsShareChain) {
        await models.LinkedThread.findOrCreate({ where: params });
      } else {
        return next(new AppError(Errors.ThreadsMustShareCommunity));
      }
    }

    const finalThread = await models.Thread.findOne({
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
          model: models.Topic,
          as: 'topic',
        },
        {
          model: models.ChainEntityMeta,
          as: 'chain_entity_meta'
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
    return next(new ServerError(e));
  }
};

export default updateLinkedThreads;
