import { AppError } from '@hicommonwealth/core';
import { CommunityStakeAttributes, UserInstance } from '@hicommonwealth/model';
import { z } from 'zod';
import { ServerCommunitiesController } from '../server_communities_controller';

export const SetCommunityStakeParamsSchema = z.object({
  community_id: z.string(),
  stake_id: z.coerce.number().int(),
});

export type SetCommunityStakeParams = z.infer<
  typeof SetCommunityStakeParamsSchema
>;

export const SetCommunityStakeBodySchema = z.object({
  stake_token: z.string().default(''),
  vote_weight: z.coerce.number().default(1),
  stake_enabled: z.coerce.boolean().default(true),
});

export type SetCommunityStakeBody = z.infer<typeof SetCommunityStakeBodySchema>;

export type PostCommunityStakeOptions = {
  user: UserInstance;
  communityStake: SetCommunityStakeParams & SetCommunityStakeBody;
};

export async function __createCommunityStake(
  this: ServerCommunitiesController,
  { communityStake }: PostCommunityStakeOptions,
): Promise<CommunityStakeAttributes> {
  const { community_id, stake_id } = communityStake;

  const [newCommunityStake, created] =
    await this.models.CommunityStake.findOrCreate({
      where: { community_id, stake_id },
      defaults: { ...communityStake },
    });

  if (!created) {
    throw new AppError('Community stake already exists');
  }

  return newCommunityStake;
}
