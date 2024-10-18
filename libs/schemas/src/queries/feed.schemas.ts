import { z } from 'zod';
import { DiscordMetaSchema, PG_INT } from '../utils';

export const ActivityComment = z.object({
  id: z.number(),
  address: z.string(),
  user_id: z.number().nullish(),
  profile_name: z.string().nullish(),
  profile_avatar: z.string().nullish(),
  text: z.string(),
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
  user_address: z.string(),
  profile_name: z.string().nullish(),
  profile_avatar: z.string().nullish(),
  body: z.string(),
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
  discord_meta: DiscordMetaSchema.nullish(),
  topic: z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
  }),
  recent_comments: z.array(ActivityComment).nullish(),
});

export const ActivityFeed = {
  input: z.object({
    thread_limit: z.number().optional(),
    comment_limit: z.number().optional(),
  }),
  output: z.array(ActivityThread),
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
