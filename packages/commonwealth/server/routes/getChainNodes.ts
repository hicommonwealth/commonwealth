import Sequelize from 'sequelize';
import { DB } from 'server/models';
import { success, TypedRequestQuery, TypedResponse } from 'server/types';
import {
  GetChainNodesReq, GetChainNodesResp
} from 'common-common/src/api/extApiTypes';
import { AppError } from 'server/util/errors';
import { ChainNodeResp, TokenBalanceCache } from 'token-balance-cache/src';

export const Errors = {
  NoArgs: "Must provide chain_node_ids or names",
  BothArgs: "Must not provide both args"
};

export const getChainNodes = async (
  models: DB,
  tbc: TokenBalanceCache,
  req: TypedRequestQuery<GetChainNodesReq>,
  res: TypedResponse<GetChainNodesResp>,
) => {
  const { chain_node_ids, names } = req.query;

  if (!chain_node_ids && !names) throw new AppError(Errors.NoArgs);
  if (chain_node_ids && names) throw new AppError(Errors.BothArgs);

  let chainNodes: ChainNodeResp[] = await tbc.getChainNodes();
  if (chain_node_ids) chainNodes = chainNodes.filter(c => chain_node_ids.includes(c.id));
  if (names) chainNodes = chainNodes.filter(c => names.includes(c.name));

  return success(res, { chain_nodes: chainNodes, count: chainNodes.length });
};