import { z } from 'zod/v4';
import { Community } from '../entities/community.schemas';
import { Thread } from '../entities/thread.schemas';
import { PG_INT } from '../utils';

const _vote = z.object({
  id: PG_INT.optional(),
  poll_id: z.number(),
  option: z.string(),
  address: z.string(),
  user_id: PG_INT.nullish(),
  author_community_id: z.string(),
  community_id: z.string(),
  calculated_voting_weight: z.string().nullish(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const Poll = z.object({
  id: PG_INT.optional(),
  community_id: z.string(),
  thread_id: z.number(),
  prompt: z.string(),
  options: z.array(z.string()),
  ends_at: z.coerce.date().nullish(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),

  // associations
  Thread: Thread.optional(),
  Community: Community.optional(),
  votes: _vote.array().optional(),
});

export const Vote = _vote.extend({
  // associations
  poll: Poll.optional(),
});
