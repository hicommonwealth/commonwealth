import { AppError } from '@hicommonwealth/core';
import {
  Community,
  CommunityStakeAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { ServerCommunitiesController } from '../server_communities_controller';

export type PutCommunityStakeOptions = {
  user: UserInstance;
  communityStake: Community.SetCommunityStakeParams &
    Community.SetCommunityStakeBody;
};

export type PutCommunityStakeResult = CommunityStakeAttributes;

export async function __createCommunityStake(
  this: ServerCommunitiesController,
  { communityStake }: PutCommunityStakeOptions,
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
