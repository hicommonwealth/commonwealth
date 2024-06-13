import { AppError } from '@hicommonwealth/core';
import { CreateCommunity } from '@hicommonwealth/schemas';
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

  const validationResult = await CreateCommunity.input.safeParseAsync(req.body);

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  const community = await controllers.communities.createCommunity({
    // @ts-expect-error StrictNullChecks
    user: req.user,
    community: validationResult.data,
  });

  controllers.analytics.track(
    {
      chainBase: community.community.base,
      communityType: null,
      event: MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
      // @ts-expect-error StrictNullChecks
      userId: req.user.id,
      community: community.community.id,
    },
    req,
  );

  return success(res, community);
};
