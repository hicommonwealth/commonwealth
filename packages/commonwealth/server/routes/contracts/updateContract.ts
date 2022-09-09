import { NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { ContractType } from 'common-common/src/types';
import { DB } from '../../database';
import { ContractAttributes } from '../../models/contract';
import { TypedRequestBody, TypedResponse, success } from '../../types';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoContractFound: 'Must provide contract id',
  CantChangeNetwork: 'Cannot change chain network',
  NotAdmin: 'Not an admin',
  NoChainFound: 'Chain not found',
};

type UpdateContractReq = ContractAttributes & {
    node_url: string;
    address: string;
    abi: string,
    contractType: ContractType;
  };

type UpdateContractResp = ContractAttributes;

const updateContract = async (
  models: DB,
  req: TypedRequestBody<UpdateContractReq>,  // TODO use explicit type instead
  res: TypedResponse<UpdateContractResp>,
  next: NextFunction
) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body?.id) return next(new Error(Errors.NoContractFound));

  const contract = await models.Contract.findOne({ where: { address: req.body.id } });
  if (!contract) return next(new Error(Errors.NoContractFound));
  else {
    if (!req.user.isAdmin) {
      return next(new Error(Errors.NotAdmin));
    }
  }

  const {
    address,
    contractType,
    abi,
    symbol,
    token_name,
    decimals
  } = req.body;

  if (abi) {
    const contractAbi = await models.ContractAbi.findOrCreate({ where: { abi } });
    const abi_id = contractAbi[0].id;
    contract.abi_id = abi_id;
  }
  if (address) contract.address = address;
  if (contractType) contract.type = contractType;
  if (symbol) contract.symbol = symbol;
  if (token_name) contract.token_name = token_name;
  if (decimals) contract.decimals = decimals;

  await contract.save();
  return success(res, contract.toJSON());
};

export default updateContract;
