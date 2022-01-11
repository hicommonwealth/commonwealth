import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';

export const Errors = {
  InvalidThread: 'Invalid thread',
};

const viewOffchainVotes = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let chain, error;
  try {
    [chain, error] = await lookupCommunityIsVisibleToUser(
      models,
      req.query,
      req.user
    );
  } catch (err) {
    throw new AppError(err);
  }
  if (error) {
    console.log('It throws an AppError');
    throw new AppError(error);
  }

  if (!req.query.thread_id) {
    throw new AppError(Errors.InvalidThread);
  }

  try {
    const votes = await models.OffchainVote.findAll({
      where: { thread_id: req.query.thread_id, chain: chain.id },
    });
    return res.json({
      status: 'Success',
      result: votes.map((v) => v.toJSON()),
    });
  } catch (err) {
    throw new ServerError(err);
  }
};

export default viewOffchainVotes;
