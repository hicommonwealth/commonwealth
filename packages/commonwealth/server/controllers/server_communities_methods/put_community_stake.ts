import { Community } from '@hicommonwealth/core';
import { CommunityStakeAttributes } from '@hicommonwealth/core/build/community/index';
import { UserInstance } from '../../models/user';
import { ServerCommunitiesController } from '../server_communities_controller';

export type PutCommunityStakeOptions = {
  user: UserInstance;
  communityStakeData: Community.SetCommunityStake;
};

export async function __putCommunityStake(
  this: ServerCommunitiesController,
  { communityStakeData }: PutCommunityStakeOptions,
): Promise<CommunityStakeAttributes> {
  const { communityStake } = communityStakeData;

  const { community_id, stake_token, stake_scaler, stake_enabled } =
    communityStake;

  const [newCommunityStake]: CommunityStakeAttributes =
    await this.models.CommunityStake.upsert({
      community_id,
      stake_token,
      stake_scaler,
      stake_enabled,
    });

  return newCommunityStake;
}
