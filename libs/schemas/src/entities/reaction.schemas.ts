import { z } from 'zod';
import { PG_INT, zDate } from '../utils';

// TODO: use this as single source of truth for model?
export const Reaction = z.object({
  id: PG_INT.nullish(),
  community_id: z.string().max(255),
  address_id: PG_INT,
  reaction: z.enum(['like']),
  created_at: zDate.nullish(),
  updated_at: zDate.nullish(),
  thread_id: PG_INT.nullish(),
  comment_id: PG_INT.nullish(),
  proposal_id: z.number().max(255).nullish(),
  canvas_action: z.any().nullish(),
  canvas_session: z.any().nullish(),
  canvas_hash: z.string().max(255).nullish(),
  calculated_voting_weight: PG_INT.nullish(),
});
