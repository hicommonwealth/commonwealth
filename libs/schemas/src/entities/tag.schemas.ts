import { z } from 'zod';
import { PG_INT } from '../utils';

export const Tags = z.object({
  id: PG_INT.optional(),
  name: z.string(),
});

export const CommunityTags = z.object({
  id: PG_INT.optional(),
  community_id: z.string(),
  tag_id: PG_INT,
  Tag: Tags.optional(),
});
