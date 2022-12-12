import Sequelize from 'sequelize';
import { DB } from 'server/models';
import {
  GetBalanceProvidersReq, GetBalanceProvidersResp,
} from 'common-common/src/api/extApiTypes';
import { TokenBalanceCache } from 'token-balance-cache/src';
import { AppError } from '../util/errors';
import { success, TypedRequestQuery, TypedResponse } from '../types';

const { Op } = Sequelize;

export const Errors = {
  NoArgs: "Must provide chain_node_ids",
};

export const getBalanceProviders = async (
  models: DB,
  tbc: TokenBalanceCache,
  req: TypedRequestQuery<GetBalanceProvidersReq>,
  res: TypedResponse<GetBalanceProvidersResp>,
) => {
  if (!req.query) throw new AppError(Errors.NoArgs);

  const { chain_node_ids } = req.query;

  const balanceProviders = await Promise.all(chain_node_ids.map(id => tbc.getBalanceProviders(id)));

  return success(res, { balance_providers: balanceProviders.flat(), count: balanceProviders.length });
};