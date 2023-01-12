import { query, validationResult } from 'express-validator';
import { ContractAttributes } from 'server/models/contract';
import { DB } from '../../models';
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

type GetContractsResp = { contracts: ContractAttributes[] };

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

  const include = [
    {
      model: models.ContractAbi,
      required: false,
    },
    {
      model: models.ChainNode,
      required: false,
    }
  ];

  const where = {};
  if (type) {
    where['type'] = type;
  }
  if (isFactory) {
    where['is_factory'] = isFactory;
  }
  if (nickname) {
    where['nickname'] = nickname;
  }

  const contracts = await models.Contract.findAll({
    where,
    include,
  });

  return success(res, { contracts });
};

export default getContracts;
