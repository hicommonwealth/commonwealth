import { z } from 'zod';

export const SnapshotSpace = z.object({
  snapshot_space: z.string().max(255),
  created_at: z.date(),
  updated_at: z.date(),
});

export const SnapshotProposal = z.object({
  id: z.string().max(255),
  title: z.string().max(255).optional(),
  body: z.string(),
  choices: z.array(z.string().max(255)),
  space: z.string().max(255),
  event: z.string().max(255).optional(),
  start: z.string().max(255).optional(),
  expire: z.string().max(255).optional(),
  is_upstream_deleted: z.boolean().default(false),
});
