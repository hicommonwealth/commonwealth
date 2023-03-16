import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { CHAIN_EVENT_SERVICE_SECRET } from '../config';
import type { DB } from '../models';

export const Errors = {
  NeedSecret: 'Must provide the secret to use this route',
  InvalidSecret: 'Must provide a valid secret to use this route',
};

export const getSubscribedChains = async (
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

  const chains = await models.Chain.findAll({
    where: { has_chain_events_listener: true },
  });

  return res.json({ status: 'Success', result: chains.map((x) => x.toJSON()) });
};
