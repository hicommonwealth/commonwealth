import { AppError } from '@hicommonwealth/core';
import {
  CommunityStakeAttributes,
  DB,
  validateCommunityStakeConfig,
} from '@hicommonwealth/model';
import { z } from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';
import { validateOwner } from '../../util/validateOwner';

const SetCommunityStakeParamsSchema = z.object({
  community_id: z.string(),
  stake_id: z.coerce.number().int(),
});
type SetCommunityStakeParams = z.infer<typeof SetCommunityStakeParamsSchema>;
const SetCommunityStakeBodySchema = z.object({
  stake_token: z.string().default(''),
  vote_weight: z.coerce.number().default(1),
  stake_enabled: z.coerce.boolean().default(true),
});
type SetCommunityStakeBody = z.infer<typeof SetCommunityStakeBodySchema>;
type PutCommunityStakesParams = SetCommunityStakeParams;
type PutCommunityStakesBody = SetCommunityStakeBody;
type PutCommunityStakesResponse = CommunityStakeAttributes;

export const putCommunityStakeHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequest<PutCommunityStakesBody, any, PutCommunityStakesParams>,
  res: TypedResponse<PutCommunityStakesResponse>,
) => {
  const paramsValidationResult = SetCommunityStakeParamsSchema.safeParse(
    req.params,
  );

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

  const bodyValidationResult = SetCommunityStakeBodySchema.safeParse(req.body);

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
