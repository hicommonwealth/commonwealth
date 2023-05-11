import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import { TypedRequestQuery, TypedResponse, success } from 'server/types';
import { BalanceType } from '../../../common-common/src/types';

export const Errors = {
  ChainExists: 'Chain Node already exists',
  NotAdmin: 'Not an admin',
};

type createChainNodeReq = {
  url: string;
  name?: string;
  bech32?: string;
  balance_type?: string;
};

const selectChain = async (
  models: DB,
  req: TypedRequestQuery<createChainNodeReq>,
  res: TypedResponse<{ node_id: number }>
) => {
  if (!req.user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const chainNode = await models.ChainNode.findOne({
    where: { url: req.query.url },
  });

  if (chainNode) {
    throw new AppError(Errors.ChainExists);
  }

  const newChainNode = await models.ChainNode.create({
    url: req.query.url,
    name: req.query.name,
    balance_type: req.query.balance_type as BalanceType,
    bech32: req.query.bech32,
  });

  return success(res, { node_id: newChainNode.id });
};

export default selectChain;
