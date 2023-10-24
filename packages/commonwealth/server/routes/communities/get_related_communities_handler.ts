import {
  GetRelatedCommunitiesQuery,
  GetRelatedCommunitiesResult
} from '../../controllers/server_communities_methods/get_related_communities';
import { ServerControllers } from '../../routing/router';
import { success, TypedRequestQuery, TypedResponse } from '../../types';

type GetRelatedCommunitiesParams = GetRelatedCommunitiesQuery;
type GetRelatedCommunitiesResponse = GetRelatedCommunitiesResult;

export const getRelatedCommunitiesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetRelatedCommunitiesParams>,
  res: TypedResponse<GetRelatedCommunitiesResponse>
) => {
  const { chainNodeId } = req.query;
  const results = await controllers.communities.getRelatedCommunities({ chainNodeId });
  return success(res, results);
};