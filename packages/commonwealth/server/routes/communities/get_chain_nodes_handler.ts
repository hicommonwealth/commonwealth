import { GetChainNodesResult } from '../../controllers/server_communities_methods/get_chain_nodes';
import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse, success } from '../../types';

type GetChainNodesRequestParams = {};
type GetChainNodesResponse = GetChainNodesResult;

export const getChainNodesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetChainNodesRequestParams>,
  res: TypedResponse<GetChainNodesResponse>,
) => {
  const results = await controllers.communities.getChainNodes({});
  return success(res, results);
};
