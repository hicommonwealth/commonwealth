import { AppError, BalanceType } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { TypedRequestBody, TypedResponse, success } from '../types';

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

const createChainNode = async (
  models: DB,
  req: TypedRequestBody<createChainNodeReq>,
  res: TypedResponse<{ node_id: number }>,
) => {
  if (!req.user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const chainNode = await models.ChainNode.findOne({
    where: { url: req.body.url },
  });

  if (chainNode) {
    throw new AppError(Errors.ChainExists);
  }

  const newChainNode = await models.ChainNode.create({
    url: req.body.url,
    name: req.body.name,
    balance_type: req.body.balance_type as BalanceType,
    bech32: req.body.bech32,
  });

  return success(res, { node_id: newChainNode.id });
};

export default createChainNode;
