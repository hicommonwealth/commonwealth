import { z } from 'zod';

export const GetCommunityStakeSchema = z.object({
  community_id: z.string(),
  stake_id: z.number().int(),
});

export type GetCommunityStake = z.infer<typeof GetCommunityStakeSchema>;
