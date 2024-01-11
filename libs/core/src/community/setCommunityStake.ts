import { z } from 'zod';

export const CommunityStakeSchema = z.object({
  community_id: z.string(),
  stake_id: z.number().int().optional(),
  stake_token: z.string().optional(),
  stake_scaler: z.number().optional(),
  stake_enabled: z.boolean().optional(),
});

export const SetCommunityStakeSchema = z.object({
  communityStake: CommunityStakeSchema,
});

export type SetCommunityStake = z.infer<typeof SetCommunityStakeSchema>;
