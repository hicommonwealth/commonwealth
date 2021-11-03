import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';
import { AppError } from '../util/errors';

export const Errors = {
  InvalidThread: 'Invalid thread',
};

const viewOffchainVotes = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(
    models,
    req.query,
    req.user
  );
  if (error) {
    throw new AppError(error);
  }

  if (!req.query.thread_id) {
    return next(new Error(Errors.InvalidThread));
  }

  try {
    const votes = await models.OffchainVote.findAll({
      where: community
        ? { thread_id: req.query.thread_id, community: community.id }
        : { thread_id: req.query.thread_id, chain: chain.id },
    });
    return res.json({
      status: 'Success',
      result: votes.map((v) => v.toJSON()),
    });
  } catch (err) {
    return next(new Error(err));
  }
};

export default viewOffchainVotes;
