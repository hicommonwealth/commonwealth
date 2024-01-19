import { z } from 'zod';

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
