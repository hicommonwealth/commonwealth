import { z } from 'zod';

export const GetThreadsParamsSchema = z.object({
  community_id: z.string(),
  bulk: z.coerce.boolean().default(false),
  thread_ids: z.coerce.number().int().array().optional(),
  active: z.string().optional(),
  search: z.string().optional(),
});

export const GetBulkThreadsParamsSchema = z.object({
  topic_id: z.coerce.number().int().optional(),
  includePinnedThreads: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().optional(),
  page: z.coerce.number().int().optional(),
  archived: z.coerce.boolean().optional(),
  stage: z.string().optional(),
  orderBy: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

export type GetThreadsParams = z.infer<typeof GetThreadsParamsSchema>;
