import { Community } from '@hicommonwealth/model';
import { CommunityStakeAttributes } from '@hicommonwealth/model/build/models/community_stake';
import { ServerCommunitiesController } from '../server_communities_controller';

export type GetCommunityStakeOptions = Community.GetCommunityStake;
export type GetCommunityStakeResult = CommunityStakeAttributes;

export async function __getCommunityStake(
  this: ServerCommunitiesController,
  { community_id, stake_id }: GetCommunityStakeResult,
): Promise<CommunityStakeAttributes> {
  const where = { community_id };
  if (stake_id) {
    where['stake_id'] = stake_id;
  }

  return await this.models.CommunityStake.findOne({
    where,
  });
}
