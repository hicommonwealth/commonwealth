import { AppError } from '@hicommonwealth/core';
import { Community, CommunityStakeAttributes, DB } from '@hicommonwealth/model';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';

type GetCommunityStakesParams = Community.GetCommunityStake;
type GetCommunityStakesResponse = CommunityStakeAttributes;

export const getCommunityStakeHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequestParams<GetCommunityStakesParams>,
  res: TypedResponse<GetCommunityStakesResponse>,
) => {
  const validationResult = Community.GetCommunityStakeSchema.safeParse(
    req.params,
  );

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  const results = await controllers.communities.getCommunityStake(
    validationResult.data,
  );

  return success(res, results);
};
