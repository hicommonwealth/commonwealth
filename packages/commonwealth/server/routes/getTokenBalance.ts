import Sequelize from 'sequelize';
import { GetTokenBalanceReq } from 'common-common/src/api/extApiTypes';
import { TokenBalanceCache, TokenBalanceResp } from 'token-balance-cache/src';
import { DB } from 'commonwealth/server/models';
import { success, TypedRequestQuery, TypedResponse } from 'commonwealth/server/types';
import { AppError } from 'commonwealth/server/util/errors';
import { requiredArgsMessage } from 'commonwealth/server/util/queries';

const { Op } = Sequelize;

export const getTokenBalance = async (
  models: DB,
  tbc: TokenBalanceCache,
  req: TypedRequestQuery<GetTokenBalanceReq>,
  res: TypedResponse<TokenBalanceResp>,
) => {
  const { chain_node_id, addresses, balance_provider, opts } = req.query;

  if(requiredArgsMessage(req.query)) throw new AppError(requiredArgsMessage(req.query));

  const results = await tbc.getBalancesForAddresses(chain_node_id, addresses, balance_provider, opts);

  return success(res, results);
};