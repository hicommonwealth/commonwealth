import { z } from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../../constants';
import { CommunityStake } from '../entities.schemas';

export const GetCommunityStake = {
  input: z.object({
    community_id: z.string(),
    stake_id: z.coerce
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .optional()
      .describe('The stake id or all stakes when undefined'),
  }),
  output: CommunityStake.optional(),
};
