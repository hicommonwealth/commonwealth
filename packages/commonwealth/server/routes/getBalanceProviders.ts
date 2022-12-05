import Sequelize from 'sequelize';
import { DB } from 'server/models';
import { success, TypedRequestQuery, TypedResponse } from 'server/types';
import {
  GetBalanceProvidersReq, GetBalanceProvidersResp,
} from 'common-common/src/api/extApiTypes';
import { AppError } from 'server/util/errors';
import { TokenBalanceCache } from 'token-balance-cache/src';

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