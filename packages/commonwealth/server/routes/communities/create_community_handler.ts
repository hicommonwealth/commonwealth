import { AppError } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/core';
import { MixpanelCommunityCreationEvent } from '../../../shared/analytics/types';
import {
  CreateCommunityOptions,
  CreateCommunityResult,
} from '../../controllers/server_communities_methods/create_community';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';

type CreateCommunityRequestBody = CreateCommunityOptions['community'];
type CreateCommunityResponse = CreateCommunityResult;

export const createCommunityHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateCommunityRequestBody>,
  res: TypedResponse<CreateCommunityResponse>,
) => {
  for (const key in req.body) {
    if (req.body[key] === '' || req.body[key] === null) {
      delete req.body[key];
    }
  }

  const validationResult = await Community.CreateCommunitySchema.safeParseAsync(
    req.body,
  );

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  const community = await controllers.communities.createCommunity({
    user: req.user,
    community: validationResult.data,
  });

  controllers.analytics.track(
    {
      chainBase: community.community.base,
      communityType: null,
      event: MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
      userId: req.user.id,
      community: community.community.id,
    },
    req,
  );

  return success(res, community);
};
