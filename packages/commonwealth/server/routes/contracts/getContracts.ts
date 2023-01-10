import { query, validationResult } from 'express-validator';
import { DB } from '../../models';
import { ContractInstance } from '../../models/contract';
import {
  TypedRequestQuery,
  TypedResponse,
  success,
  failure,
} from '../../types';

export const getContractsValidation = [
  query('type').optional().isString().trim(),
  query('isFactory').optional().isBoolean().toBoolean(),
  query('nickname').optional().isString().trim(),
];

type GetContractsReq = {
  type?: string;
  isFactory?: boolean;
  nickname?: string;
};

type GetContractsResp = ContractInstance[];

const getContracts = async (
  models: DB,
  req: TypedRequestQuery<GetContractsReq>,
  res: TypedResponse<GetContractsResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { type, isFactory, nickname } = req.query;

  const where = { type, is_factory: isFactory, nickname };

  const contracts = await models.Contract.findAll({
    where,
  });

  return success(res, contracts);
};

export default getContracts;
