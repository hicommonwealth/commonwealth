import { Community } from '@hicommonwealth/core';
import { CommunityStakeAttributes } from '../../models/community_stake';
import { UserInstance } from '../../models/user';
import { ServerCommunitiesController } from '../server_communities_controller';

export type PutCommunityStakeOptions = {
  user: UserInstance;
  communityStake: Community.SetCommunityStake;
};

export type PutCommunityStakeResult = CommunityStakeAttributes;

export async function __putCommunityStake(
  this: ServerCommunitiesController,
  { communityStake }: PutCommunityStakeOptions,
): Promise<CommunityStakeAttributes> {
  const { community_id, stake_token, stake_id, stake_scaler, stake_enabled } =
    communityStake;

  const [newCommunityStake] = await this.models.CommunityStake.findOrCreate({
    where: { community_id },
    defaults: {
      community_id,
      stake_token,
      stake_id,
      stake_scaler,
      stake_enabled,
    },
  });

  return newCommunityStake;
}
