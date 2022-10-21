import { NextFunction } from 'express';
import Web3 from 'web3';
import BN from 'bn.js';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from 'server/models';
import { ContractAbiAttributes } from 'server/models/contract_abi';
import { ContractAttributes } from '../../models/contract';
import { TypedRequestBody, TypedResponse, success } from '../../types';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoContractId: 'Must provide contract id',
  NoAbi: 'Must provide abi',
  ContractAddressExists: 'The address already exists',
  ChainIDExists:
    'The id for this chain already exists, please choose another id',
  ChainNameExists:
    'The name for this chain already exists, please choose another name',
  NotAdmin: 'Must be admin',
};

export type CreateContractAbiReq = {
  contractId: number;
  abi: Array<Record<string, unknown>>;
};

export type CreateContractAbiResp = {
  contractAbi: ContractAbiAttributes;
  contract: ContractAttributes;
};

const createContractAbi = async (
  models: DB,
  req: TypedRequestBody<CreateContractAbiReq>,
  res: TypedResponse<CreateContractAbiResp>,
  next: NextFunction
) => {
  const { contractId, abi } = req.body;

  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  if (!contractId) {
    return next(new Error(Errors.NoContractId));
  }

  if (!abi) {
    return next(new Error(Errors.NoAbi));
  }

  try {
    const contract_abi = await models.ContractAbi.create({
      abi,
    });

    const contract = await models.Contract.findOne({
      where: { id: contractId },
    });

    if (contract && contract_abi) {
      contract.abi_id = contract_abi.id;
      await contract.save();
    }

    return success(res, {
      contractAbi: contract_abi.toJSON(),
      contract,
    });
  } catch (err) {
    console.log('Error creating contract abi: ', err);
    return next(err);
  }
};

export default createContractAbi;
