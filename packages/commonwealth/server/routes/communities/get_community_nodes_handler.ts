import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { GetCommunityNodesResult } from 'server/controllers/server_communities_methods/get_community_nodes';

type GetCommunityNodesRequestParams = {};
type GetCommunityNodesResponse = GetCommunityNodesResult;

export const getCommunityNodesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetCommunityNodesRequestParams>,
  res: TypedResponse<GetCommunityNodesResponse>
) => {
  const results = await controllers.communities.getCommunityNodes({});
  return success(res, results);
};
