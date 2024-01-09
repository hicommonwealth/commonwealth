import { z } from 'zod';

export const CommunityStakeSchema = z.object({
  id: z.number().optional(),
  community_id: z.string(),
  stake_id: z.number().int().optional(),
  stake_token: z.number().optional(),
  stake_scaler: z.number().optional(),
  stake_enabled: z.boolean().optional(),
});

export type CommunityStakeAttributes = z.infer<typeof CommunityStakeSchema>;

export const SetCommunityStakeSchema = z.object({
  communityStake: CommunityStakeSchema,
  namespace: z.string(),
});

export type SetCommunityStake = z.infer<typeof SetCommunityStakeSchema>;
