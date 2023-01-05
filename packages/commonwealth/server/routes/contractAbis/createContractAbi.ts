import { factory, formatFilename } from 'common-common/src/logging';
import { AppError, ServerError } from 'common-common/src/errors';
import { AbiItem } from 'web3-utils';
import { DB } from '../../models';
import { ContractAbiAttributes } from '../../models/contract_abi';
import { parseAbiItemsFromABI } from '../../../shared/abi_utils';
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

  // Parse ABI to validate it as a properly formatted ABI
  const abiAsRecord: Array<Record<string, unknown>> = JSON.parse(abi);
  if (!abiAsRecord) {
    throw new AppError(Errors.InvalidABI);
  }
  const abiItems: AbiItem[] = parseAbiItemsFromABI(abiAsRecord);
  if (!abiItems) {
    throw new AppError(Errors.InvalidABI);
  }

  const contract_abi = await models.ContractAbi.create({
    abi: abiAsRecord,
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
