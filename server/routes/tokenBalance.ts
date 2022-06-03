import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError } from '../util/errors';
import { TypedResponse, success, TypedRequestBody } from '../types';
import { ChainInstance } from '../models/chain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { AddressInstance } from '../models/address';
import TokenBalanceCache from '../util/tokenBalanceCache';

import { factory, formatFilename } from '../../shared/logging';
import { ContractInstance } from 'server/models/contract';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  InvalidAddress: 'Invalid address',
  QueryFailed: 'Balance query failed',
};

type TokenBalanceReq = { address: string, author_chain: string, chain: string, contract_address: string };
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
  let contract: ContractInstance;

  try {
    [chain, error] = await validateChain(models, req.body);
    if (error) throw new Error(error);
  } catch (err) {
    throw new AppError(err);
  }
  try {
    [author, error] = await lookupAddressIsOwnedByUser(models, req);
    if (error) throw new Error(error);
  } catch (err) {
    throw new AppError(err)
  }

  try {
    const { contract_address } = req.body;
    contract = await models.Contract.findOne({
      where: {
        address: contract_address,
      }
    });
  } catch (err) {
    throw new AppError(err);
  }



  try {
    const balance = await tokenBalanceCache.getBalance(contract, author.address);
    return success(res, balance.toString());
  } catch (err) {
    log.info(`Failed to query token balance: ${err.message}`);
    throw new Error(Errors.QueryFailed);
  }
};

export default tokenBalance;
