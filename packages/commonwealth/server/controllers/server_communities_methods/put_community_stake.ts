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
  stake_token: z.string().optional(),
  stake_scaler: z.coerce.number().optional(),
  stake_enabled: z.coerce.boolean().optional(),
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
