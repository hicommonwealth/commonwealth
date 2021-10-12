import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';

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
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new Error(authorError));
  const { linked_thread_id, linking_thread_id } = req.body;
  try {
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