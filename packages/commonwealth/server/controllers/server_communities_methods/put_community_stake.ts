import { Community, UserInstance } from '@hicommonwealth/model';
import { CommunityStakeAttributes } from '@hicommonwealth/model/build/models/community_stake';
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
    where: { community_id, stake_id },
    defaults: {
      community_id,
      stake_token,
      stake_id,
      stake_scaler,
      stake_enabled,
    },
    logging: true,
  });

  return newCommunityStake;
}
