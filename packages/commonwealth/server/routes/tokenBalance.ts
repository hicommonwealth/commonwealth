import TokenBalanceCache from 'token-balance-cache/src/index';
import { factory, formatFilename } from 'common-common/src/logging';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';
import { TypedResponse, success, TypedRequestBody } from '../types';
import { ChainInstance } from '../models/chain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { AddressInstance } from '../models/address';
import { ChainNetwork } from '../../../common-common/src/types';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  InvalidAddress: 'Invalid address',
  QueryFailed: 'Balance query failed',
};

type TokenBalanceReq = { address: string, author_chain: string, chain: string };
type TokenBalanceResp = string;

const tokenBalance = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: TypedRequestBody<TokenBalanceReq>,
  res: TypedResponse<TokenBalanceResp>
) => {
  if (!req.body.address) {
    throw new AppError(Errors.InvalidAddress)
  }

  let chain: ChainInstance;
  let author: AddressInstance;
  let error: string;
  try {
    [chain, error] = await validateChain(models, req.body);
    if (error) throw new AppError(error);
  } catch (err) {
    throw new AppError(err);
  }
  try {
    [author, error] = await lookupAddressIsOwnedByUser(models, req);
    if (error) throw new AppError(error);
  } catch (err) {
    throw new AppError(err)
  }

  try {
    const balance = await tokenBalanceCache.getBalance(
      chain.chain_node_id,
      author.address,
      chain.address,
      chain.network === ChainNetwork.ERC20
        ? 'erc20' : chain.network === ChainNetwork.ERC721
          ? 'erc721' : chain.network === ChainNetwork.SPL
            ? 'spl-token' : undefined,
    );
    return success(res, balance.toString());
  } catch (err) {
    log.info(`Failed to query token balance: ${err.message}`);
    throw new ServerError(Errors.QueryFailed);
  }
};

export default tokenBalance;
