import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { CHAIN_EVENT_SERVICE_SECRET } from '../config';

export const Errors = {
  NeedChainId: 'Must provide a chain id to fetch',
  InvalidChain: 'Invalid chain',
  NeedSecret: 'Must provide the secret to use this route',
  InvalidSecret: 'Must provide a valid secret to use this route',
};

export const getChain = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.secret) {
    return next(new AppError(Errors.NeedSecret));
  }

  if (req.body.secret != CHAIN_EVENT_SERVICE_SECRET) {
    return next(new AppError(Errors.InvalidSecret));
  }

  if (!req.body.chain_id) {
    return next(new AppError(Errors.NeedChainId));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.body.chain_id },
  });

  if (!chain) {
    return next(new AppError(Errors.InvalidChain));
  }

  return res.json({ status: 'Success', result: chain.toJSON() });
};
