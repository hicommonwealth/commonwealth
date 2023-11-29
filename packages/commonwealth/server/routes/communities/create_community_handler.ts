import { AppError } from 'common-common/src/errors';
import { MixpanelCommunityCreationEvent } from '../../../shared/analytics/types';
import { createCommunitySchema } from '../../../shared/schemas/createCommunitySchema';
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
  for (const key in req.body) {
    if (req.body[key] === '' || req.body[key] === null) {
      delete req.body[key];
    }
  }

  const validationResult = await createCommunitySchema().safeParseAsync(
    req.body,
  );

  if (validationResult.success === false) {
    throw new AppError(
      validationResult.error.issues
        .map(({ path, message }) => `${path.join(': ')}: ${message}`)
        .join(', '),
    );
  }

  const community = await controllers.communities.createCommunity({
    user: req.user,
    community: validationResult.data,
  });

  controllers.analytics.track(
    {
      chainBase: community.community.base,
      isCustomDomain: null,
      communityType: null,
      event: MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
    },
    req,
  );

  return success(res, community);
};
