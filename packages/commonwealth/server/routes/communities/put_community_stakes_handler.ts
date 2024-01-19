import { AppError } from '@hicommonwealth/adapters';
import { Community, DB } from '@hicommonwealth/model';
import { CommunityStakeAttributes } from '@hicommonwealth/model/build/models/community_stake';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';
import { validateCommunityStakeConfig } from '../../util/commonProtocol/communityStakeConfigValidator';
import { formatErrorPretty } from '../../util/errorFormat';

type PutCommunityStakesParams = Community.SetCommunityStakeParams;
type PutCommunityStakesBody = Community.SetCommunityStakeBody;
type PutCommunityStakesResponse = CommunityStakeAttributes;

export const putCommunityStakeHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequest<PutCommunityStakesBody, any, PutCommunityStakesParams>,
  res: TypedResponse<PutCommunityStakesResponse>,
) => {
  const paramsValidationResult =
    Community.SetCommunityStakeParamsSchema.safeParse(req.params);

  if (paramsValidationResult.success === false) {
    throw new AppError(formatErrorPretty(paramsValidationResult));
  }

  const { community_id, stake_id } = paramsValidationResult.data;

  const adminAddress = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .find((a) => a.community_id === community_id && a.role === 'admin');

  if (!adminAddress) {
    throw new AppError(
      'User must be an admin of the community to update the community stakes',
    );
  }

  await validateCommunityStakeConfig(models, community_id, stake_id);

  const bodyValidationResult = Community.SetCommunityStakeBodySchema.safeParse(
    req.body,
  );

  if (bodyValidationResult.success === false) {
    throw new AppError(formatErrorPretty(bodyValidationResult));
  }

  const results = await controllers.communities.putCommunityStake({
    user: req.user,
    communityStake: {
      ...paramsValidationResult.data,
      ...bodyValidationResult.data,
    },
  });

  return success(res, results);
};
