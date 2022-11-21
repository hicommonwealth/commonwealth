import { TokenBalanceCache, TokenBalanceResp as TBCResp } from 'token-balance-cache/src/index';
import { factory, formatFilename } from 'common-common/src/logging';

import validateChain from '../util/validateChain';
import { DB } from '../models';
import { AppError, ServerError } from '../util/errors';
import { TypedResponse, success, TypedRequestBody } from '../types';
import { ChainInstance } from '../models/chain';
import { ChainNetwork } from '../../../common-common/src/types';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  InvalidAddress: 'Invalid address',
  QueryFailed: 'Balance query failed',
};

type TokenBalanceReq = {
  address: string;
  author_chain: string;
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
    throw new AppError(Errors.InvalidAddress);
  }

  let chain: ChainInstance;
  let error: string;
  try {
    [chain, error] = await validateChain(models, req.body);
    if (error) throw new AppError(error);
  } catch (err) {
    throw new AppError(err);
  }

  let chain_node_id = chain?.ChainNode?.id;
  if (!chain_node_id) {
    throw new ServerError(`No chain node found for chain ${chain.id}`)
  }

  // TODO: generalize this flow into a helper -> too much repeated querying
  let bp: string;
  try {
    const providersResult = await tokenBalanceCache.getBalanceProviders(chain_node_id);
    bp = providersResult[0].bp;
  } catch (e) {
    log.info(e.message);
    throw new AppError(`No token balance provider found for ${chain.id}`);
  }

  // grab contract if provided, otherwise query native token
  let opts = {};
  if (req.body.contract_address) {
    let contractType: string | undefined;
    if (chain.network === ChainNetwork.ERC20) {
      contractType = 'erc20';
    } else if (chain.network === ChainNetwork.ERC721) {
      contractType = 'erc721';
    } else {
      throw new AppError('Unsupported contract type');
    }
    const contract = await models.Contract.findOne({
      where: {
        address: req.body.contract_address,
      },
      include: [{ model: models.ChainNode, required: true }],
    });
    if (!contract) {
      throw new AppError('Contract not found');
    }
    chain_node_id = contract.ChainNode.id; // override based on Contract
    opts = {
      tokenAddress: contract.address,
      contractType,
    };
  }

  let balancesResp: TBCResp;
  try {
    balancesResp = await tokenBalanceCache.getBalancesForAddresses(
      chain_node_id,
      [ req.body.address ],
      bp,
      opts,
    );
  } catch (err) {
    log.info(`Failed to query token balance: ${err.message}`);
    throw new ServerError(Errors.QueryFailed);
  }

  if (balancesResp.balances[req.body.address]) {
    return success(res, balancesResp.balances[req.body.address]);
  } else if (balancesResp.errors[req.body.address]) {
    throw new AppError(`Error querying balance: ${balancesResp.errors[req.body.address]}`);
  } else {
    throw new ServerError(Errors.QueryFailed);
  }
};

export default tokenBalance;
