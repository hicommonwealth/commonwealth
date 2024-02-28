import {
  DeleteCommunityOptions,
  DeleteCommunityResult,
} from '../../controllers/server_communities_methods/delete_community';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

type DeleteCommunityRequestParams = DeleteCommunityOptions;
type DeleteCommunityResponse = DeleteCommunityResult;

export const deleteCommunityHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteCommunityRequestParams>,
  res: TypedResponse<DeleteCommunityResponse>,
) => {
  const community = await controllers.communities.deleteCommunity({
    user: req.user,
    communityId: req.params.communityId,
  });
  return success(res, community);
};
