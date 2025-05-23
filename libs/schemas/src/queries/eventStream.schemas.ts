import { z } from 'zod';
import { DiscordMetaSchema, PG_INT } from '../utils';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

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

export const ActivityThread = z.object({
  community_id: z.string(),
  community_icon: z.string().nullish(),
  id: z.number(),
  user_id: z.number(),
  user_tier: z.number(),
  user_address: z.string(),
  profile_name: z.string().nullish(),
  profile_avatar: z.string().nullish(),
  body: z.string(),
  content_url: z.string().nullish(),
  title: z.string(),
  kind: z.string(),
  stage: z.string(),
  number_of_comments: z.number(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  deleted_at: z.string().nullish(),
  locked_at: z.string().nullish(),
  archived_at: z.string().nullish(),
  marked_as_spam_at: z.string().nullish(),
  read_only: z.boolean(),
  has_poll: z.boolean().nullish(),
  is_linking_token: z.boolean().optional(),
  launchpad_token_address: z.string().nullish(),
  discord_meta: DiscordMetaSchema.nullish(),
  topic: z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
  }),
  recent_comments: z.array(ActivityComment).nullish(),
});

export const GlobalFeed = {
  input: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    cursor: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .default(1)
      .describe(
        'required for tRPC useInfiniteQuery hook, equivalent to page number',
      ),
    comment_limit: z.number().int().min(0).max(10).optional().default(3),
  }),
  output: z.object({
    results: z.array(ActivityThread),
    limit: z.number(),
    page: z.number(),
  }),
};

export const ActivityFeed = {
  input: PaginationParamsSchema.extend({
    thread_limit: z.number().optional(),
    comment_limit: z.number().optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(ActivityThread),
  }),
};
export const ActivityThreadWrapper = z.object({
  thread: ActivityThread,
});
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
