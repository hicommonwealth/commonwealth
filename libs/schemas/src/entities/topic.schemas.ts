import { z } from 'zod';
import { PG_INT } from '../utils';

export const Topic = z.object({
  id: PG_INT.optional(),
  name: z.string().max(255).default('General'),
  community_id: z.string().max(255),
  description: z.string().default(''),
  telegram: z.string().max(255).nullish(),
  featured_in_sidebar: z.boolean().default(false),
  featured_in_new_post: z.boolean().default(false),
  default_offchain_template: z.string().nullish(),
  order: PG_INT.nullish(),
  channel_id: z.string().max(255).nullish(),
  default_offchain_template_backup: z.string().nullish(),
});
