import { Community } from '@hicommonwealth/core';
import { AppError } from 'common-common/src/errors';
import { ServerControllers } from '../../routing/router';
import { success, TypedRequestBody, TypedResponse } from '../../types';
import { validChains } from '../../util/commonProtocol/chainConfig';
import { validateCommunityStakeConfig } from '../../util/commonProtocol/communityStakeConfigValidator';
import { formatErrorPretty } from '../../util/errorFormat';

type PutCommunityStakesParams = Community.SetCommunityStake;
type PutCommunityStakesResponse = Community.CommunityStakeAttributes;

export const putCommunityStakeHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<PutCommunityStakesParams>,
  res: TypedResponse<PutCommunityStakesResponse>,
) => {
  const validationResult = Community.SetCommunityStakeSchema.parse(req.body);

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  await validateCommunityStakeConfig(
    this.models,
    validationResult.data.namespace,
    2,
    validChains.Goerli,
  );

  const results = await controllers.communities.putCommunityStake({
    user: req.user,
    communityStakeData: validationResult.data,
  });

  return success(res, results);
};
