import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoChain: 'Must provide chain',
  ChainNF: 'Chain not found',
};

const selectChain = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.chain) {
    return next(new AppError(Errors.NoChain));
  }

  const chain = await models.Chain.findOne({ where: { id: req.body.chain } });
  if (!chain) {
    return next(new AppError(Errors.ChainNF));
  }
  req.user.setSelectedChain(chain);
  await req.user.save();
  return res.json({ status: 'Success' });
};

export default selectChain;
