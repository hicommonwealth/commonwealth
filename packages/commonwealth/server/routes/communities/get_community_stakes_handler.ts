import { AppError } from '@hicommonwealth/core';
import { CommunityStakeAttributes, DB } from '@hicommonwealth/model';
import {
  GetCommunityStakeOptions,
  GetCommunityStakeSchema,
} from 'server/controllers/server_communities_methods/get_community_stake';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';

type GetCommunityStakesParams = GetCommunityStakeOptions;
type GetCommunityStakesResponse = CommunityStakeAttributes;

export const getCommunityStakeHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequestParams<GetCommunityStakesParams>,
  res: TypedResponse<GetCommunityStakesResponse>,
) => {
  const validationResult = GetCommunityStakeSchema.safeParse(req.params);

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  const results = await controllers.communities.getCommunityStake(
    validationResult.data,
  );

  return success(res, results);
};
