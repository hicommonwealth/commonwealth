import { AppError, ServerError } from 'common-common/src/errors';
import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import { FetchTokenBalanceErrors } from 'token-balance-cache/src/index';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { fn, col, literal } from 'sequelize';
import { BN } from 'ethereumjs-util';

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
  all?: boolean;
};

type TokenBalanceResp =
  | string
  | {
      address: string;
      balance: string;
    }[];

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
    let balance:
      | string
      | {
          address: string;
          balance: string;
        }[];
    if (req.body.all) {
      const user_id = req.user?.id;
      const addresses: any = await models.Address.findAll({
        attributes: [[fn('DISTINCT', col('address')), 'distinctAddress']],
        where: {
          chain: req.body.chain,
          user_id: user_id,
        },
      });

      if (addresses.length == 0) {
        throw new AppError('No Addresses associated with user on this chain');
      }

      balance = await Promise.all(
        addresses.map(async (address) => {
          const addrBalance = await tokenBalanceCache.fetchUserBalance(
            chain.network,
            chain_node_id,
            address.dataValues.distinctAddress,
            req.body.contract_address
          );
          return { address, balance: addrBalance };
        })
      );
    } else {
      balance = await tokenBalanceCache.fetchUserBalance(
        chain.network,
        chain_node_id,
        req.body.address,
        req.body.contract_address
      );
    }
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
