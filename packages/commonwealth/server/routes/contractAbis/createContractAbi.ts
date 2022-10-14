import { NextFunction } from 'express';
import Web3 from 'web3';
import BN from 'bn.js';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { ContractAttributes } from '../../models/contract';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { DB } from '../../models';

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

type CreateContractAbiReq = {
  contractId: number;
  abi: string;
};

type CreateContractAbiResp = {
  contractAbi: any;
  contract: ContractAttributes;
};

const createContractAbi = async (
  models: DB,
  req: TypedRequestBody<CreateContractAbiReq>,
  res: TypedResponse<CreateContractAbiResp>,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  // require Admin privilege for creating Contract
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }

  if (!req.body.contractId) {
    return next(new Error(Errors.NoContractId));
  }

  if (!req.body.abi) {
    return next(new Error(Errors.NoAbi));
  }

  const {
    contractId,
    abi,
  } = req.body;

  try {
    const contract_abi = await models.ContractAbi.create({
      abi,
    });

    const contract = await models.Contract.findOne({
      where: { id: contractId },
    });
    if (contract) contract.abi_id = contract_abi.id;
    await contract.save();

    return success(res, {
      contractAbi: contract_abi.toJSON(),
      contract
    });
  } catch (err) {
    console.log('Error creating contract abi: ', err);
    return next(err);
  }
};

export default createContractAbi;
