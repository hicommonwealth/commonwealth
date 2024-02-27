import { CommunitySchema, CommunityStakeSchema } from '@hicommonwealth/model';
import { z } from 'zod';

export const getCommunityStakeSchema = {
  input: z.object({
    community_id: z.string(),
    stake_id: z.coerce.number().int().optional(),
  }),
  output: CommunityStakeSchema,
};

export const setCommunityStakeSchema = {
  input: z.object({
    stake_id: z.coerce.number().int(),
    stake_token: z.string().default(''),
    vote_weight: z.coerce.number().default(1),
    stake_enabled: z.coerce.boolean().default(true),
  }),
  output: CommunitySchema.merge(
    z.object({
      CommunityStakes: CommunityStakeSchema,
    }),
  ),
};
