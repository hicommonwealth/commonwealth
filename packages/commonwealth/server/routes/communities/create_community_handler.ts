import { MixpanelCommunityCreationEvent } from '../../../shared/analytics/types';
import {
  CreateCommunityOptions,
  CreateCommunityResult,
} from '../../controllers/server_communities_methods/create_community';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateCommunityRequestBody = CreateCommunityOptions['community'];
type CreateCommunityResponse = CreateCommunityResult;

export const createCommunityHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateCommunityRequestBody>,
  res: TypedResponse<CreateCommunityResponse>,
) => {
  const community = await controllers.communities.createCommunity({
    user: req.user,
    community: req.body,
  });

  controllers.analytics.track(
    {
      chainBase: community.community.base,
      isCustomDomain: null,
      communityType: null,
      event: MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
      userId: req.user.id,
      community: community.community.id,
    },
    req,
  );

  return success(res, community);
};
