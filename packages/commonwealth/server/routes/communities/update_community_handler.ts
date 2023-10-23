import { TypedRequestBody, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import {
  UpdateCommunityOptions,
  UpdateCommunityResult,
} from 'server/controllers/server_communities_methods/update_community';
import { MixpanelCommunityCreationEvent } from 'shared/analytics/types';
import { ChainAttributes } from 'server/models/chain';

type UpdateCommunityRequestBody = ChainAttributes & {
  id: string;
  'featured_topics[]'?: string[];
  'snapshot[]'?: string[];
};
type UpdateCommunityResponse = UpdateCommunityResult;

export const updateCommunityHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateCommunityRequestBody>,
  res: TypedResponse<UpdateCommunityResponse>
) => {
  const {
    'featured_topics[]': featuredTopics,
    'snapshot[]': snapshot,
    ...rest
  } = req.body;
  const community = await controllers.communities.updateCommunity({
    user: req.user,
    featuredTopics,
    snapshot,
    ...rest,
  });
  return success(res, community);
};
