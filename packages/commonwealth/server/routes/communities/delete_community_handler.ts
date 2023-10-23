import { TypedRequestParams, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import {
  DeleteCommunityOptions,
  DeleteCommunityResult,
} from 'server/controllers/server_communities_methods/delete_community';

type DeleteCommunityRequestParams = DeleteCommunityOptions;
type DeleteCommunityResponse = DeleteCommunityResult;

export const deleteCommunityHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteCommunityRequestParams>,
  res: TypedResponse<DeleteCommunityResponse>
) => {
  const community = await controllers.communities.deleteCommunity({
    user: req.user,
    id: req.params.id,
  });
  return success(res, community);
};
