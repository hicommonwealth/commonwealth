import {
  TypedRequest,
  TypedRequestBody,
  TypedResponse,
  success,
} from '../../types';
import { ServerControllers } from '../../routing/router';
import {
  CreateCommunityOptions,
  CreateCommunityResult,
} from 'server/controllers/server_communities_methods/create_community';

type CreateCommunityRequestBody = CreateCommunityOptions['community'];
type CreateCommunityResponse = CreateCommunityResult;

export const createCommunityHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateCommunityRequestBody>,
  res: TypedResponse<CreateCommunityResponse>
) => {
  const community = await controllers.communities.createCommunity({
    user: req.user,
    community: req.body,
  });
  return success(res, community);
};
