import { DB } from 'server/models';
import {
  GetChainNodesReq,
  GetChainNodesResp,
  needParamErrMsg,
} from 'common-common/src/api/extApiTypes';
import { ChainNodeResp, TokenBalanceCache } from 'token-balance-cache/src';
import { oneOf, query, validationResult } from 'express-validator';
import { failure, success, TypedRequestQuery, TypedResponse } from '../types';

export const getChainNodesValidation = [
  oneOf(
    [
      query('chain_node_ids').exists().toInt().toArray(),
      query('names').exists().toArray(),
    ],
    `${needParamErrMsg} (chain_node_ids, names)`
  ),
  query('count_only').optional().isBoolean().toBoolean(),
];
export const getChainNodes = async (
  models: DB,
  tbc: TokenBalanceCache,
  req: TypedRequestQuery<GetChainNodesReq>,
  res: TypedResponse<GetChainNodesResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }
  const { chain_node_ids, names } = req.query;

  let chainNodes: ChainNodeResp[] = await tbc.getChainNodes();
  if (chain_node_ids)
    chainNodes = chainNodes.filter((c) => chain_node_ids.includes(c.id));
  if (names) chainNodes = chainNodes.filter((c) => names.includes(c.name));

  return success(res, { chain_nodes: chainNodes, count: chainNodes.length });
};
