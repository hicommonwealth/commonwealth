import { CommunityAttributes } from '@hicommonwealth/model';
import { UpdateCommunityResult } from 'server/controllers/server_communities_methods/update_community';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type UpdateCommunityRequestBody = CommunityAttributes & {
  id: string;
  'featured_topics[]'?: string[];
  'snapshot[]'?: string[];
  transactionHash?: string; // necessary for namespace update
};
type UpdateCommunityResponse = UpdateCommunityResult;

export const updateCommunityHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateCommunityRequestBody>,
  res: TypedResponse<UpdateCommunityResponse>,
) => {
  const {
    'featured_topics[]': featuredTopics,
    'snapshot[]': snapshot,
    ...rest
  } = req.body;
  const { analyticsOptions, ...community } =
    await controllers.communities.updateCommunity({
      user: req.user,
      featuredTopics,
      snapshot,
      ...rest,
    });

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, community);
};
