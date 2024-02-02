import { AppError } from '@hicommonwealth/core';
import {
  Community,
  CommunityStakeAttributes,
  DB,
  validateCommunityStakeConfig,
} from '@hicommonwealth/model';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';
import { validateOwner } from '../../util/validateOwner';

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

  const user = req.user;
  const isAdmin = await validateOwner({
    models,
    user,
    communityId: community_id,
    allowMod: false,
    allowAdmin: true,
    allowSuperAdmin: true,
  });

  if (!isAdmin) {
    throw new AppError(
      'User must be an admin of the community to update the community stakes',
    );
  }

  const community = await models.Community.findOne({
    where: {
      id: community_id,
    },
    include: [
      {
        model: models.ChainNode,
        attributes: ['eth_chain_id', 'url'],
      },
    ],
    attributes: ['namespace'],
  });

  await validateCommunityStakeConfig(community, stake_id);

  const bodyValidationResult = Community.SetCommunityStakeBodySchema.safeParse(
    req.body,
  );

  if (bodyValidationResult.success === false) {
    throw new AppError(formatErrorPretty(bodyValidationResult));
  }

  const results = await controllers.communities.putCommunityStake({
    user,
    communityStake: {
      ...paramsValidationResult.data,
      ...bodyValidationResult.data,
    },
  });

  return success(res, results);
};
