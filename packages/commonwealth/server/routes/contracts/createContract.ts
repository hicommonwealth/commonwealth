import { NextFunction } from 'express';
import Web3 from 'web3';
import BN from 'bn.js';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { ContractType } from 'common-common/src/types';
import { ContractAttributes } from '../../models/contract';
import { ChainNodeAttributes } from '../../models/chain_node';
import { DB } from '../../models';
import { TypedRequestBody, TypedResponse, success } from '../../types';

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
  InvalidBase: 'Must provide valid chain base',
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

type CreateContractReq = ContractAttributes &
  Omit<ChainNodeAttributes, 'id'> & {
    node_url: string;
    address: string;
    abi: Array<Record<string, unknown>>;
    contractType: ContractType;
  };

type CreateContractResp = {
  contract: ContractAttributes;
};

const createContract = async (
  models: DB,
  req: TypedRequestBody<CreateContractReq>,
  res: TypedResponse<CreateContractResp>,
  next: NextFunction
) => {
  const {
    address,
    contractType,
    abi,
    symbol,
    token_name,
    decimals,
    chain_node_id,
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

  if (!contractType || !contractType.trim()) {
    return next(new Error(Errors.NoType));
  }

  if (!Web3.utils.isAddress(address)) {
    return next(new Error(Errors.InvalidAddress));
  }

  if (decimals < 0 || decimals > 18) {
    return next(new Error(Errors.InvalidDecimal));
  }

  const oldContract = await models.Contract.findOne({
    where: { address },
  });

  if (oldContract && oldContract.address === address) {
    return next(new Error(Errors.ContractAddressExists));
  }

  // override provided URL for eth chains (typically ERC20) with stored, unless none found
  const node = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      id: chain_node_id,
    },
  });

  if (!node) {
    return next(new Error('Node not found'));
  }

  // transactionalize contract creation
  await models.sequelize.transaction(async (t) => {
    const contract_abi = await models.ContractAbi.create({
      abi,
    }, { transaction: t });

    const [contract, result] = await models.Contract.findOrCreate({
      where: {
        address,
        chain_node_id: node.id,
        token_name,
        abi_id: contract_abi.id,
        symbol,
        decimals,
        type: contractType,
      },
      transaction: t
    });

    const nodeJSON = node.toJSON();
    delete nodeJSON.private_url;

    return success(res, { contract: contract.toJSON() });
  });
};

export default createContract;
