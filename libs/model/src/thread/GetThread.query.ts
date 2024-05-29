import { z } from 'zod';

export const GetThreadsParamsSchema = z.object({
  community_id: z.string(),
  bulk: z.coerce.boolean().default(false),
  thread_ids: z.coerce.number().int().array().optional(),
  active: z.string().optional(),
  search: z.string().optional(),
  count: z.coerce.boolean().optional().default(false),
  include_count: z.coerce.boolean().default(false),
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
  contestAddress: z.string().optional(),
  status: z.string().optional(),
  withXRecentComments: z.coerce.number().optional(),
});

export type GetThreadsParams = z.infer<typeof GetThreadsParamsSchema>;
