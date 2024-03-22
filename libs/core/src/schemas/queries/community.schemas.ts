import { z } from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../../constants';
import { CommunityStake, StakeTransaction } from '../entities.schemas';

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

export const GetStakeTransaction = {
  input: z.object({
    address: z.string().optional(),
    community_id: z.string().optional(),
  }),
  output: StakeTransaction.and(z.object({ address: z.string() })).array(),
};

export const GetStakeHistoricalPrice = {
  input: z.object({
    past_date_epoch: z.number().min(1),
    community_id: z.string(),
    stake_id: z
      .number()
      .int()
      .min(MIN_SCHEMA_INT)
      .max(MAX_SCHEMA_INT)
      .default(2),
  }),
  output: z.object({
    old_price: z.string().nullable(),
  }),
};
