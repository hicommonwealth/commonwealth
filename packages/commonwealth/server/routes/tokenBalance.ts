import { TokenBalanceCache, TokenBalanceResp as TBCResp } from 'token-balance-cache/src/index';
import { factory, formatFilename } from 'common-common/src/logging';
import { ContractInstance } from '../models/contract';
import validateChain from '../util/validateChain';
import { DB } from '../models';
import { AppError, ServerError } from 'common-common/src/errors';
import { TypedResponse, success, TypedRequestBody } from '../types';
import { ChainInstance } from '../models/chain';
import { BalanceType, ChainNetwork } from '../../../common-common/src/types';

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
  // let author: AddressInstance;
  let error: string;
  let contract: ContractInstance;
  try {
    [chain, error] = await validateChain(models, req.body);
    if (error) throw new AppError(error);
  } catch (err) {
    throw new AppError(err);
  }

  // NOTE: Removing validation of ownership of address, seemingly unnecessary for logic
  // try {
  //   [author, error] = await lookupAddressIsOwnedByUser(models, req);
  //   if (error) throw new AppError(error);
  // } catch (err) {
  //   throw new AppError(err)
  // }

  let chain_node_id = chain?.ChainNode?.id;
  if (!chain_node_id) {
    throw new ServerError(`No chain node found for chain ${chain.id}`)
  }

  let bp: string;
  try {
    const providersResult = await tokenBalanceCache.getBalanceProviders(chain_node_id);
    bp = providersResult[0].bp;
  } catch (e) {
    log.info(e.message);
    throw new AppError(`No token balance provider found for ${chain.id}`);
  }

  if (
    chain.ChainNode?.balance_type &&
    [BalanceType.Ethereum, BalanceType.Solana, BalanceType.NEAR].includes(chain.ChainNode.balance_type) &&
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

  let balancesResp: TBCResp;
  try {
    balancesResp = await tokenBalanceCache.getBalancesForAddresses(
      chain_node_id,
      [ req.body.address ],
      bp,
      {
        tokenAddress: contract?.address,
        contractType: chain.network === ChainNetwork.ERC20
          ? 'erc20' : chain.network === ChainNetwork.ERC721
            ? 'erc721' : undefined,
      },
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
