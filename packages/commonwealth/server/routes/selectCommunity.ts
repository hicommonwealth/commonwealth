import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoChain: 'Must provide chain',
  ChainNF: 'Chain not found',
};

const selectCommunity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.chain) {
    return next(new AppError(Errors.NoChain));
  }

  const community = await models.Community.findOne({
    where: { id: req.body.chain },
  });
  if (!community) {
    return next(new AppError(Errors.ChainNF));
  }
  req.user.setSelectedChain(community);
  await req.user.save();
  return res.json({ status: 'Success' });
};

export default selectCommunity;
