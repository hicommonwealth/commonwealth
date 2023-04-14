import type { GetBalanceProvidersReq, GetBalanceProvidersResp, } from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import type { DB } from 'server/models';
import type { TokenBalanceCache } from 'token-balance-cache/src';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { failure, success } from '../types';

export const getBalanceProvidersValidation = [
  query('chain_node_ids').exists().toInt().toArray(),
];

export const getBalanceProviders = async (
  models: DB,
  tbc: TokenBalanceCache,
  req: TypedRequestQuery<GetBalanceProvidersReq>,
  res: TypedResponse<GetBalanceProvidersResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { chain_node_ids } = req.query;

  const balanceProviders = await Promise.all(
    chain_node_ids.map((id) => tbc.getBalanceProviders(id))
  );

  return success(res, {
    balance_providers: balanceProviders.flat(),
    count: balanceProviders.length,
  });
};
