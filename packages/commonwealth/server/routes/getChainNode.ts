import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { CHAIN_EVENT_SERVICE_SECRET } from '../config';

export const Errors = {
  NeedChainNodeId: 'Must provide a chain node id to fetch',
  InvalidChainNode: 'Invalid chain node',
  NeedSecret: 'Must provide the secret to use this route',
  InvalidSecret: 'Must provide a valid secret to use this route',
};

export const getChainNode = async (
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

  if (!req.body.chain_node_id) {
    return next(new AppError(Errors.NeedChainNodeId));
  }

  const chainNode = await models.ChainNode.findOne({
    where: { id: req.body.chain_node_id },
  });

  if (!chainNode) {
    return next(new AppError(Errors.InvalidChainNode));
  }

  return res.json({ status: 'Success', result: chainNode.toJSON() });
};
