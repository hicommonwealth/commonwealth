import { z } from 'zod';
import { DiscordMetaSchema, PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';
import { ThreadView } from './thread.schemas';

export const ActivityComment = z.object({
  id: z.number(),
  address: z.string(),
  user_id: z.number().nullish(),
  profile_name: z.string().nullish(),
  profile_avatar: z.string().nullish(),
  body: z.string(),
  content_url: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string().nullish(),
  deleted_at: z.string().nullish(),
  marked_as_spam_at: z.string().nullish(),
  discord_meta: DiscordMetaSchema.nullish(),
});

export const GlobalFeed = {
  input: PaginationParamsSchema.extend({
    comment_limit: z.number().int().min(0).max(10).optional().default(3),
    community_id: z.string().optional(),
    search: z.string().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(ThreadView),
  }),
};

export const ActivityFeed = {
  input: PaginationParamsSchema.extend({
    thread_limit: z.number().optional(),
    comment_limit: z.number().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(ThreadView),
  }),
};

export const ChainFeedRecord = z.object({
  community_id: z.string(),
  network: z.string(),
  block_number: PG_INT,
  event_data: z.object({
    id: z.string(),
    kind: z.string(),
  }),
});

export const ChainFeed = {
  input: z.object({}),
  output: z.array(ChainFeedRecord),
};

export const EventStreamItemSchema = z.object({
  type: z.string(),
  data: z.any(),
  url: z.string(),
});

export const EventStream = {
  input: z.object({}),
  output: z.object({
    items: z.array(EventStreamItemSchema),
  }),
};
