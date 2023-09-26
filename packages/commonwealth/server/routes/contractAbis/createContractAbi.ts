import { AppError } from 'common-common/src/errors';
import type { DB } from '../../models';
import type { ContractAbiAttributes } from '../../models/contract_abi';
import type { ContractAttributes } from '../../models/contract';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';
import validateAbi from '../../util/abiValidation';

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
  nickname?: string;
};

export type CreateContractAbiResp = {
  contractAbi: ContractAbiAttributes;
  contract: ContractAttributes;
};

const createContractAbi = async (
  models: DB,
  req: TypedRequestBody<CreateContractAbiReq>,
  res: TypedResponse<CreateContractAbiResp>
) => {
  const { contractId, abi, nickname } = req.body;

  if (!req.user) {
    throw new AppError('Not logged in');
  }

  if (!contractId) {
    throw new AppError(Errors.NoContractId);
  }

  if (!abi || abi === '') {
    throw new AppError(Errors.NoAbi);
  }

  const abiAsRecord = validateAbi(abi);

  const contract_abi = await models.ContractAbi.create({
    abi: JSON.stringify(abiAsRecord),
    nickname,
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
};

export default createContractAbi;
