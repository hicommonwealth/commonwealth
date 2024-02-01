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

export type PutCommunityStakeOptions = {
  user: UserInstance;
  communityStake: SetCommunityStakeParams & SetCommunityStakeBody;
};

export type PutCommunityStakeResult = CommunityStakeAttributes;

export async function __putCommunityStake(
  this: ServerCommunitiesController,
  { communityStake }: PutCommunityStakeOptions,
): Promise<CommunityStakeAttributes> {
  const [newCommunityStake] = await this.models.CommunityStake.upsert(
    communityStake,
  );

  return newCommunityStake;
}
