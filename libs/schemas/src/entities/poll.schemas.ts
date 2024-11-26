import { z } from 'zod';
import { Community } from '../entities/community.schemas';
import { Thread } from '../entities/thread.schemas';
import { PG_INT } from '../utils';

const _vote = z.object({
  id: PG_INT.optional(),
  poll_id: z.number(),
  option: z.string(),
  address: z.string(),
  author_community_id: z.string(),
  community_id: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const Poll = z.object({
  id: PG_INT.optional(),
  community_id: z.string(),
  thread_id: z.number(),
  prompt: z.string(),
  options: z.string(),
  ends_at: z.coerce.date(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),

  // associations
  Thread: Thread.optional(),
  Community: Community.optional(),
  votes: _vote.optional(),
});

export const Vote = _vote.extend({
  // associations
  poll: Poll.optional(),
});
