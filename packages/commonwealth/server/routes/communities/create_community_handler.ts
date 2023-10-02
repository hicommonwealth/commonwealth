import { TypedRequestBody, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import {
  CreateCommunityOptions,
  CreateCommunityResult,
} from 'server/controllers/server_communities_methods/create_community';
import { MixpanelCommunityCreationEvent } from 'shared/analytics/types';

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

  controllers.analytics.track(
    {
      chainBase: community.chain.base,
      isCustomDomain: null,
      communityType: null,
      event: MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
    },
    req
  );

  return success(res, community);
};
