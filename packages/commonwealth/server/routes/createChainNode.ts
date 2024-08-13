import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';
import { TypedRequestBody, TypedResponse, success } from '../types';

export const Errors = {
  ChainExists: 'Chain Node already exists',
  NotAdmin: 'Not an admin',
  MissingChainArguments: 'Missing chain arguments',
  BalanceTypeNotSupported: 'Balance type not supported',
};

type createChainNodeReq = {
  url: string;
  name: string;
  balance_type: string;
  eth_chain_id: number;
};

const createChainNode = async (
  models: DB,
  req: TypedRequestBody<createChainNodeReq>,
  res: TypedResponse<{ node_id: number; node_name: string }>,
) => {
  if (!req.user?.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const { url, name, balance_type, eth_chain_id } = req.body;

  if (!url || !name || !balance_type || !eth_chain_id) {
    throw new AppError(Errors.MissingChainArguments);
  }

  if (balance_type != 'ethereum') {
    throw new AppError(Errors.BalanceTypeNotSupported);
  }

  const chainNode = await models.ChainNode.findOne({
    where: { eth_chain_id },
  });

  if (chainNode) {
    throw new AppError(Errors.ChainExists);
  }

  const newChainNode = await models.ChainNode.create({
    url,
    name,
    balance_type: balance_type as BalanceType,
    alt_wallet_url: url,
    eth_chain_id,
  });

  return success(res, {
    node_id: newChainNode.id!,
    node_name: newChainNode.name!,
  });
};

export default createChainNode;
