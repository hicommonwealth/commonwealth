import { z } from 'zod';

export const GetCommunityStakeSchema = z.object({
  community_id: z.string(),
  stake_id: z.coerce.number().int().optional(),
});

export type GetCommunityStake = z.infer<typeof GetCommunityStakeSchema>;
