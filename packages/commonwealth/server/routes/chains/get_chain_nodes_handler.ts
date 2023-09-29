import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { GetCommunityNodesResult } from 'server/controllers/server_communities_methods/get_community_nodes';

type GetChainNodesRequestParams = {};
type GetChainNodesResponse = GetCommunityNodesResult;

export const getChainNodesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetChainNodesRequestParams>,
  res: TypedResponse<GetChainNodesResponse>
) => {
  const results = await controllers.communities.getCommunityNodes({});
  return success(res, results);
};
