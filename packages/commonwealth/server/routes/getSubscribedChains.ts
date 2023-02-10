import type { DB } from '../models';
import type { NextFunction, Request, Response } from 'express';

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
  const chains = await models.Chain.findAll({
    where: { has_chain_events_listener: true },
  });

  return res.json({ status: 'Success', result: chains.map((x) => x.toJSON()) });
};
