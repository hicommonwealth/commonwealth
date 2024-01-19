import { AppError } from '@hicommonwealth/adapters';
import { Community, DB } from '@hicommonwealth/model';
import { CommunityStakeAttributes } from '@hicommonwealth/model/build/models/community_stake';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { validateCommunityStakeConfig } from '../../util/commonProtocol/communityStakeConfigValidator';
import { formatErrorPretty } from '../../util/errorFormat';

type PutCommunityStakesParams = Community.SetCommunityStake;
type PutCommunityStakesResponse = CommunityStakeAttributes;

export const putCommunityStakeHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequestBody<PutCommunityStakesParams>,
  res: TypedResponse<PutCommunityStakesResponse>,
) => {
  const validationResult = Community.SetCommunityStakeSchema.safeParse(
    req.body,
  );

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  await validateCommunityStakeConfig(
    models,
    validationResult.data.community_id,
    req.body.stake_id,
  );

  const results = await controllers.communities.putCommunityStake({
    user: req.user,
    communityStake: validationResult.data,
  });

  return success(res, results);
};
