import { AppError } from '@hicommonwealth/adapters';
import type { ContractType } from '@hicommonwealth/core';
import { AbiType } from '@hicommonwealth/core';
import type {
  ChainNodeAttributes,
  ContractAbiInstance,
  ContractAttributes,
  ContractInstance,
  DB,
} from '@hicommonwealth/model';
import { hashAbi } from '@hicommonwealth/model';
import { Transaction } from 'sequelize';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';
import validateAbi from '../../util/abiValidation';
import { validateOwner } from '../../util/validateOwner';

export const Errors = {
  NoType: 'Must provide contract type',
  NoBase: 'Must provide chain base',
  NoNodeUrl: 'Must provide node url',
  InvalidAddress: 'Address is invalid',
  InvalidNodeUrl: 'Node url must begin with http://, https://, ws://, wss://',
  InvalidNode: 'Node url returned invalid response',
  InvalidABI: 'Invalid ABI passed in',
  NoAbiNickname: 'Must provide ABI nickname',
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
    abi?: string;
    abiNickname?: string;
    contractType: ContractType;
    chain_id: string;
  };

export type CreateContractResp = {
  contract: ContractAttributes;
  hasGlobalTemplate?: boolean;
};

async function findOrCreateAbi(
  abi: AbiType,
  models: DB,
  t?: Transaction,
): Promise<ContractAbiInstance> {
  let contractAbi: ContractAbiInstance;
  const abiHash = hashAbi(abi);
  contractAbi = await models.ContractAbi.findOne({
    where: {
      abi_hash: abiHash,
    },
    transaction: t,
  });

  if (!contractAbi) {
    contractAbi = await models.ContractAbi.create(
      {
        abi: abi,
        abi_hash: abiHash,
      },
      { transaction: t },
    );
  }

  return contractAbi;
}

const createContract = async (
  models: DB,
  req: TypedRequestBody<CreateContractReq>,
  res: TypedResponse<CreateContractResp>,
) => {
  const {
    address,
    contractType = '',
    abi,
    symbol = '',
    token_name = '',
    decimals = 0,
    chain_node_id,
    chain_id,
  } = req.body;

  if (!req.user) {
    throw new AppError('Not signed in');
  }

  const isAdmin = await validateOwner({
    models: models,
    user: req.user,
    communityId: chain_id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError('Must be admin');
  }

  const Web3 = (await import('web3-utils')).default;
  if (!Web3.isAddress(address)) {
    throw new AppError(Errors.InvalidAddress);
  }

  if (!chain_node_id) {
    throw new AppError(Errors.NoNodeUrl);
  }

  let abiAsRecord: Array<Record<string, unknown>>;
  if (abi) {
    if ((Object.keys(JSON.parse(abi)) as Array<string>).length === 0) {
      throw new AppError(Errors.InvalidABI);
    }

    abiAsRecord = validateAbi(abi);
  }

  const oldContract = await models.Contract.findOne({
    where: { address },
  });

  if (oldContract && oldContract.address === address) {
    if (abi && !oldContract.abi_id) {
      const contract_abi = await findOrCreateAbi(abiAsRecord, models);
      oldContract.abi_id = contract_abi.id;
      await oldContract.save();
    }
    // contract already exists so attempt to add it to the community if it's not already there
    await models.CommunityContract.findOrCreate({
      where: {
        community_id: chain_id,
        contract_id: oldContract.id,
      },
    });
    const globalTemplate = await models.Template.findOne({
      where: {
        abi_id: oldContract.abi_id,
      },
    });
    return success(res, {
      contract: oldContract.toJSON(),
      hasGlobalTemplate: !!globalTemplate,
    });
  }

  // override provided URL for eth chains (typically ERC20) with stored, unless none found
  const node = await models.ChainNode.findOne({
    where: {
      id: chain_node_id,
    },
  });

  if (!node) {
    throw new AppError(Errors.InvalidNodeUrl);
  }

  let contract: ContractInstance;
  let contract_abi: ContractAbiInstance;
  if (abi) {
    // transactionalize contract creation
    await models.sequelize.transaction(async (t) => {
      contract_abi = await findOrCreateAbi(abiAsRecord, models, t);

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
          community_id: chain_id,
          contract_id: contract.id,
        },
        { transaction: t },
      );
    });

    const globalTemplate = await models.Template.findOne({
      where: {
        abi_id: contract.abi_id,
      },
    });

    return success(res, {
      contract: contract.toJSON(),
      hasGlobalTemplate: !!globalTemplate,
    });
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
          community_id: chain_id,
          contract_id: contract.id,
        },
        { transaction: t },
      );
    });

    const globalTemplate = await models.Template.findOne({
      where: {
        abi_id: contract.abi_id,
      },
    });

    return success(res, {
      contract: contract.toJSON(),
      hasGlobalTemplate: !!globalTemplate,
    });
  }
};

export default createContract;
