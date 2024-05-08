import { z } from 'zod';
import { PG_INT } from '../utils';

// TODO: use this as single source of truth for model?
export const Reaction = z.object({
  id: PG_INT.optional(),
  community_id: z.string().max(255),
  address_id: PG_INT,
  reaction: z.enum(['like']),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  thread_id: PG_INT,
  comment_id: PG_INT,
  proposal_id: z.string().max(255).optional(),
  canvas_action: z.any().optional(),
  canvas_session: z.any().optional(),
  canvas_hash: z.string().max(255).optional(),
  calculated_voting_weight: PG_INT.optional(),
});
