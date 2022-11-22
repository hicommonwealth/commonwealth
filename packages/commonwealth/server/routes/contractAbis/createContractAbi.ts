import { NextFunction } from 'express';
import Web3 from 'web3';
import BN from 'bn.js';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from 'server/models';
import { ContractAbiAttributes } from 'server/models/contract_abi';
import { AbiItem } from 'web3-utils';
import { parseAbiItemsFromABI } from 'commonwealth/client/scripts/helpers/abi_utils';
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
  InvalidABI: 'Invalid ABI',
};

export type CreateContractAbiReq = {
  contractId: number;
  abi: string;
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

  let abiAsRecord: Array<Record<string, unknown>>;
  if (abi !== '') {
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

  try {
    const contract_abi = await models.ContractAbi.create({
      abi: abiAsRecord,
    });

    const contract = await models.Contract.findOne({
      where: { id: contractId },
    });

    if (!contract) {
      return success(res, {
        contractAbi: contract_abi.toJSON(),
        contract: null,
      });
    }

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
