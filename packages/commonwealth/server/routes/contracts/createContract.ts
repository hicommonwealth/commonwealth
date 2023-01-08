import { factory, formatFilename } from 'common-common/src/logging';
import type { ContractType } from 'common-common/src/types';
import { parseAbiItemsFromABI } from 'commonwealth/client/scripts/helpers/abi_utils';
import type { NextFunction } from 'express';
import type { DB } from 'server/models';
import Web3 from 'web3';
import type { AbiItem } from 'web3-utils';
import type { ChainNodeAttributes } from '../../models/chain_node';
import type { ContractAttributes } from '../../models/contract';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoType: 'Must provide contract type',
  NoBase: 'Must provide chain base',
  NoNodeUrl: 'Must provide node url',
  InvalidAddress: 'Address is invalid',
  InvalidNodeUrl: 'Node url must begin with http://, https://, ws://, wss://',
  InvalidNode: 'Node url returned invalid response',
  InvalidABI: 'Invalid ABI',
  MustBeWs: 'Node must support websockets on ethereum',
  InvalidBalanceType: 'Must provide balance type',
  InvalidChainId: 'Ethereum chain ID not provided or unsupported',
  InvalidChainIdOrUrl:
    'Could not determine a valid endpoint for provided chain',
  InvalidDecimal: 'Invalid decimal',
  ContractAddressExists: 'The address already exists',
  ChainIDExists:
    'The id for this chain already exists, please choose another id',
  ChainNameExists:
    'The name for this chain already exists, please choose another name',
  NotAdmin: 'Must be admin',
};

export type CreateContractReq = ContractAttributes &
  Omit<ChainNodeAttributes, 'id'> & {
    community: string;
    node_url: string;
    address: string;
    abi: string;
    contractType: ContractType;
  };

export type CreateContractResp = {
  contract: ContractAttributes;
};

const createContract = async (
  models: DB,
  req: TypedRequestBody<CreateContractReq>,
  res: TypedResponse<CreateContractResp>,
  next: NextFunction
) => {
  const {
    community,
    address,
    contractType,
    abi,
    symbol,
    token_name,
    decimals,
    chain_node_id,
    balance_type,
  } = req.body;

  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  // require Admin privilege for creating Contract
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }

  if (abi && (Object.keys(abi) as Array<string>).length === 0) {
    return next(new Error(Errors.InvalidABI));
  }
  let abiAsRecord: Array<Record<string, unknown>>;
  if (abi) {
    try {
      // Parse ABI to validate it as a properly formatted ABI
      abiAsRecord = JSON.parse(abi);
      if (!abiAsRecord) {
        return next(new Error(Errors.InvalidABI));
      }
      const abiItems: AbiItem[] = parseAbiItemsFromABI(abiAsRecord);
      if (!abiItems) {
        return next(new Error(Errors.InvalidABI));
      }
    } catch {
      return next(new Error(Errors.InvalidABI));
    }
  }

  if (!contractType || !contractType.trim()) {
    return next(new Error(Errors.NoType));
  }

  if (!Web3.utils.isAddress(address)) {
    return next(new Error(Errors.InvalidAddress));
  }

  if (decimals < 0 || decimals > 18) {
    return next(new Error(Errors.InvalidDecimal));
  }
  if (!chain_node_id) {
    return next(new Error(Errors.NoNodeUrl));
  }
  if (!balance_type) {
    return next(new Error(Errors.InvalidBalanceType));
  }

  const oldContract = await models.Contract.findOne({
    where: { address },
  });

  if (oldContract && oldContract.address === address) {
    return next(new Error(Errors.ContractAddressExists));
  }

  // override provided URL for eth chains (typically ERC20) with stored, unless none found
  const node = await models.ChainNode.findOne({
    where: {
      id: chain_node_id,
    },
  });

  if (!node) {
    return next(new Error(Errors.InvalidNodeUrl));
  }

  let contract;
  if (abi != null) {
    // transactionalize contract creation
    await models.sequelize.transaction(async (t) => {
      const contract_abi = await models.ContractAbi.create(
        {
          abi: abiAsRecord,
        },
        { transaction: t }
      );

      [contract] = await models.Contract.findOrCreate({
        where: {
          address,
          chain_node_id: node.id,
          token_name,
          abi_id: contract_abi.id,
          symbol,
          decimals,
          type: contractType,
        },
        transaction: t,
      });

      await models.CommunityContract.create(
        {
          chain_id: community,
          contract_id: contract.id,
        },
        { transaction: t }
      );
    });
    return success(res, { contract: contract.toJSON() });
  } else {
    // transactionalize contract creation
    await models.sequelize.transaction(async (t) => {
      [contract] = await models.Contract.findOrCreate({
        where: {
          address,
          token_name,
          symbol,
          decimals,
          type: contractType,
          chain_node_id: node.id,
        },
        transaction: t,
      });
      await models.CommunityContract.create(
        {
          chain_id: community,
          contract_id: contract.id,
        },
        { transaction: t }
      );
    });
    return success(res, { contract: contract.toJSON() });
  }
};

export default createContract;
