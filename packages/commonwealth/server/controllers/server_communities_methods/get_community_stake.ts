import { CommunityStakeAttributes } from '@hicommonwealth/model';
import { z } from 'zod';
import { ServerCommunitiesController } from '../server_communities_controller';

export const GetCommunityStakeSchema = z.object({
  community_id: z.string(),
  stake_id: z.coerce.number().int().optional(),
});

export type GetCommunityStakeOptions = z.infer<typeof GetCommunityStakeSchema>;
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
    include: [
      {
        model: this.models.Community,
        required: true,
        attributes: ['namespace'],
      },
    ],
  });
}
