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
  try {
    await models.LinkedThread.create({
      linked_thread: req.body.linked_thread_id,
      linking_thread: req.body.linking_thread_id,
    });
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(new Error(e));
  }
};

export default updateLinkedThreads;