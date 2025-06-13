import { z } from 'zod/v4';
import { PG_INT } from '../utils';

export const StakeTransaction = z.object({
  transaction_hash: z.string().length(66),
  community_id: z.string(),
  stake_id: PG_INT.default(2),
  address: z.string(),
  stake_amount: PG_INT,
  stake_price: z.coerce.string(),
  stake_direction: z.enum(['buy', 'sell']),
  timestamp: PG_INT,
});

export const CommunityStake = z.object({
  id: PG_INT.optional(),
  community_id: z.string(),
  stake_id: PG_INT.default(1),
  stake_token: z.string().default(''),
  vote_weight: PG_INT.default(1),
  stake_enabled: z.boolean().default(false),

  StakeTransactions: z.array(StakeTransaction).nullish(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
