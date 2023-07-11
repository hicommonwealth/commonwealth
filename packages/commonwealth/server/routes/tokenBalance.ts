import { AppError, ServerError } from 'common-common/src/errors';
import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import { FetchTokenBalanceErrors } from 'token-balance-cache/src/index';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NoAddress: 'Address not found',
  NoContract: 'Contract not found',
  NoChainNode: 'Chain node not found',
  QueryFailed: 'Balance query failed',
};

type TokenBalanceReq = {
  address: string;
  chain: string;
  contract_address?: string;
};
type TokenBalanceResp = string;

const tokenBalance = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: TypedRequestBody<TokenBalanceReq>,
  res: TypedResponse<TokenBalanceResp>
) => {
  if (!req.body.address) {
    throw new AppError(Errors.NoAddress);
  }

  const chain = req.chain;

  let chain_node_id = chain?.ChainNode?.id;
  if (!chain_node_id) {
    throw new ServerError(Errors.NoChainNode);
  }

  if (req.body.contract_address) {
    const contract = await models.Contract.findOne({
      where: {
        address: req.body.contract_address,
      },
      include: [{ model: models.ChainNode, required: true }],
    });
    if (!contract) {
      throw new AppError(Errors.NoContract);
    }
    chain_node_id = contract.ChainNode.id; // override based on Contract
  }

  try {
    const balance = await tokenBalanceCache.fetchUserBalance(
      chain.network,
      chain_node_id,
      req.body.address,
      req.body.contract_address
    );
    return success(res, balance);
  } catch (e) {
    if (e.message === FetchTokenBalanceErrors.NoBalanceProvider) {
      throw new AppError(FetchTokenBalanceErrors.NoBalanceProvider);
    } else if (e.message === FetchTokenBalanceErrors.UnsupportedContractType) {
      throw new AppError(FetchTokenBalanceErrors.UnsupportedContractType);
    } else {
      throw new ServerError(Errors.QueryFailed, e);
    }
  }
};

export default tokenBalance;
