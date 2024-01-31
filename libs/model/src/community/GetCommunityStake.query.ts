import { z } from 'zod';

export const GetCommunityStake = z.object({
  community_id: z.string(),
  stake_id: z.coerce.number().int().optional(),
});

export type GetCommunityStake = z.infer<typeof GetCommunityStake>;
