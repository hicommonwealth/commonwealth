import { z } from 'zod/v4';
import { PG_INT } from '../utils';

export const Tags = z.object({
  id: PG_INT.optional(),
  name: z.string(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const CommunityTags = z.object({
  community_id: z.string(),
  tag_id: PG_INT,
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  // associations
  Tag: Tags.nullish(),
});
