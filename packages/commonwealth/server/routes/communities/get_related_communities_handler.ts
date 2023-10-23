import {
  GetRelatedCommunitiesOptions,
  GetRelatedCommunitiesResult
} from '../../controllers/server_chains_methods/get_related_communities';
import { ServerControllers } from '../../routing/router';
import { success, TypedRequestQuery, TypedResponse } from '../../types';

type GetRelatedCommunitiesParams = GetRelatedCommunitiesOptions;
type GetRelatedCommunitiesResponse = GetRelatedCommunitiesResult;

export const getRelatedCommunitiesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetRelatedCommunitiesParams>,
  res: TypedResponse<GetRelatedCommunitiesResponse>
) => {
  const { chainNodeId } = req.query;
  const results = await controllers.chains.getRelatedCommunities({ chainNodeId });
  return success(res, results);
};