import { TypedRequestParams, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import {
  GetCommunityStatsOptions,
  GetCommunityStatsResult,
} from 'server/controllers/server_communities_methods/get_community_stats';

type GetCommunityStatsRequestParams = {
  communityId: string;
};
type GetCommunityStatsResponse = GetCommunityStatsResult;

export const getCommunityStatsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<GetCommunityStatsRequestParams>,
  res: TypedResponse<GetCommunityStatsResponse>
) => {
  const community = await controllers.communities.getCommunityStats({
    user: req.user,
    chainId: req.params.communityId,
  });
  return success(res, community);
};
