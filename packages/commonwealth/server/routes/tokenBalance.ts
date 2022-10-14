import TokenBalanceCache from 'token-balance-cache/src/index';
import { factory, formatFilename } from 'common-common/src/logging';
import { ContractInstance } from '../models/contract';
import validateChain from '../util/validateChain';
import { DB } from '../models';
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

  let chain_node_id = chain.ChainNode.id;
  if (
    ['ethereum', 'near', 'solana'].includes(chain.ChainNode.chain_base) &&
    chain.network !== ChainNetwork.AxieInfinity
  ) {
    try {
      const { contract_address } = req.body;
      contract = await models.Contract.findOne({
        where: {
          address: contract_address,
        },
        include: [{ model: models.ChainNode, required: true }],
      });
      chain_node_id = contract.ChainNode.id; // override based on Contract
    } catch (err) {
      throw new AppError(err);
    }
  }

  try {
    const { contract_address } = req.body;
    contract = await models.Contract.findOne({
      where: {
        address: contract_address,
      },
      include: [{ model: models.ChainNode, required: true }],
    });
  } catch (err) {
    throw new AppError(err);
  }



  try {
    const balance = await tokenBalanceCache.getBalance(
      chain_node_id,
      author.address,
      contract?.address,
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
