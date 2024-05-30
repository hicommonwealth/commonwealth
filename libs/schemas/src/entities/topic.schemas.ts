import { z } from 'zod';
import { PG_INT } from '..';

export const Topic = z.object({
  id: PG_INT.optional(),
  name: z.string().max(255).default('General'),
  community_id: z.string().max(255),
  description: z.string().default(''),
  telegram: z.string().max(255).optional().nullable(),
  featured_in_sidebar: z.boolean().default(false),
  featured_in_new_post: z.boolean().default(false),
  default_offchain_template: z.string().optional().nullable(),
  order: PG_INT.nullish(),
  channel_id: z.string().max(255).optional().nullable(),
  group_ids: z.array(PG_INT).default([]),
  default_offchain_template_backup: z.string().optional().nullable(),
});
