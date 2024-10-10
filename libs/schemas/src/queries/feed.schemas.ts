import { z } from 'zod';
import { DiscordMetaSchema, PG_INT } from '../utils';

export const ActivityThread = z.object({
  id: PG_INT,
  community_id: z.string(),
  body: z.string(),
  title: z.string(),
  numberOfComments: PG_INT,
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  deleted_at: z.string().nullish(),
  locked_at: z.string().nullish(),
  kind: z.string(),
  stage: z.string(),
  archived_at: z.string().nullish(),
  read_only: z.boolean(),
  has_poll: z.boolean().nullish(),
  marked_as_spam_at: z.string().nullish(),
  discord_meta: DiscordMetaSchema.nullish(),
  profile_name: z.string().nullish(),
  profile_avatar: z.string().nullish(),
  user_id: PG_INT,
  user_address: z.string(),
  topic: z.object({
    id: PG_INT,
    name: z.string(),
    description: z.string(),
  }),
});

export const ActivityComment = z.object({
  id: PG_INT,
  address: z.string(),
  text: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullish(),
  deleted_at: z.string().nullish(),
  marked_as_spam_at: z.string().nullish(),
  discord_meta: DiscordMetaSchema.nullish(),
  profile_name: z.string().nullish(),
  profile_avatar_url: z.string().nullish(),
  user_id: z.number().nullish(),
});

export const ActivityFeedRecord = z.object({
  thread: ActivityThread,
  recent_comments: z.array(ActivityComment).nullish(),
});

export const ActivityFeed = {
  input: z.object({}),
  output: z.array(ActivityFeedRecord),
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
