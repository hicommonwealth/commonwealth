import { GetTokenBalanceReq } from 'common-common/src/api/extApiTypes';
import { TokenBalanceCache, TokenBalanceResp } from 'token-balance-cache/src';
import { DB } from 'commonwealth/server/models';
import { success, TypedRequestQuery, TypedResponse } from 'commonwealth/server/types';
import { AppError } from 'commonwealth/server/util/errors';

export const getTokenBalance = async (
  models: DB,
  tbc: TokenBalanceCache,
  req: TypedRequestQuery<GetTokenBalanceReq>,
  res: TypedResponse<TokenBalanceResp>,
) => {
  const { chain_node_id, addresses, balance_provider, opts } = req.query;

  let error = 'Must provide';
  if(!chain_node_id) error += 'chain_node_id, ';
  if(!addresses) error += 'addresses, ';
  if(!balance_provider) error += 'balance_provider, ';
  if(!opts) error += 'opts, ';

  if(error != 'Must provide') throw new AppError('Must provide community_id');

  const results = await tbc.getBalancesForAddresses(chain_node_id, addresses, balance_provider, opts);

  return success(res, results);
};