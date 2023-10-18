import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { GetChainNodesResult } from 'server/controllers/server_chains_methods/get_chain_nodes';

type GetChainNodesRequestParams = {};
type GetChainNodesResponse = GetChainNodesResult;

export const getChainNodesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetChainNodesRequestParams>,
  res: TypedResponse<GetChainNodesResponse>
) => {
  const temp = 0;
  const results = await controllers.chains.getChainNodes({});
  return success(res, results);
};
