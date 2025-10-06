import { z } from 'zod';
import { PG_INT } from '../utils';
import { Address, USER_TIER } from './user.schemas';

export const Reaction = z.object({
  id: PG_INT.optional(),
  address_id: PG_INT,
  reaction: z.enum(['like']),
  thread_id: PG_INT.nullish(),
  comment_id: PG_INT.nullish(),
  proposal_id: z.number().nullish(),
  calculated_voting_weight: z.string().nullish(),
  canvas_signed_data: z.any().nullish(),
  canvas_msg_id: z.string().max(255).nullish(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  user_tier_at_creation: USER_TIER.nullish(),

  // associations
  Address: Address.optional(),
});
