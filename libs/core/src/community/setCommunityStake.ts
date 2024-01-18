import { z } from 'zod';

export const SetCommunityStakeSchema = z.object({
  community_id: z.string(),
  stake_id: z.number().int().optional(),
  stake_token: z.string().optional(),
  stake_scaler: z.number().optional(),
  stake_enabled: z.boolean().optional(),
});

export type SetCommunityStake = z.infer<typeof SetCommunityStakeSchema>;
