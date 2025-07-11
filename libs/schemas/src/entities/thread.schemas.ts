import { LinkSource } from '@hicommonwealth/shared';
import { z } from 'zod';
import { DiscordMetaSchema, PG_INT } from '../utils';
import { Reaction } from './reaction.schemas';
import { Topic } from './topic.schemas';
import { Address, USER_TIER } from './user.schemas';

export const Link = z.object({
  source: z.nativeEnum(LinkSource),
  identifier: z.string(),
  title: z.string().nullable().optional(),
});

export const ThreadVersionHistory = z.object({
  id: PG_INT.optional(),
  thread_id: PG_INT,
  address: z
    .string()
    .describe('Address of the creator of the post or the collaborator'),
  body: z.string(),
  timestamp: z.date(),
  content_url: z.string().nullish(),
});

export const Thread = z.object({
  id: PG_INT.optional(),
  address_id: PG_INT,
  title: z.string(),
  kind: z.string(),
  stage: z.string().optional(),
  body: z.string(),
  url: z.string().nullish(),
  topic_id: PG_INT,
  pinned: z.boolean().nullish(),
  community_id: z.string(),
  view_count: PG_INT.optional(),
  links: Link.array().nullish(),
  content_url: z.string().nullish(),
  read_only: z.boolean().nullish(),
  has_poll: z.boolean().nullish(),
  canvas_signed_data: z.string().nullish(),
  canvas_msg_id: z.string().nullish(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  last_edited: z.coerce.date().nullish(),
  deleted_at: z.coerce.date().nullish(),
  last_commented_on: z.coerce.date().nullish(),
  marked_as_spam_at: z.coerce.date().nullish(),
  archived_at: z.coerce.date().nullish(),
  locked_at: z.coerce.date().nullish(),
  discord_meta: DiscordMetaSchema.nullish(),
  user_tier_at_creation: USER_TIER.nullish(),

  //counts
  reaction_count: PG_INT.optional(),
  reaction_weights_sum: z
    .string()
    .refine((str) => {
      return /^[0-9]+$/.test(str); // only numbers
    })
    .nullish(),
  comment_count: PG_INT.optional().optional(),

  activity_rank_date: z.coerce.date().nullish(),

  created_by: z.string().nullish(),
  profile_name: z.string().nullish(),

  search: z.union([z.string(), z.record(z.string(), z.any())]).nullish(),
  is_linking_token: z.boolean().optional(),
  launchpad_token_address: z.string().nullable().optional(),

  // associations
  Address: Address.nullish(),
  Reaction: Reaction.nullish(),
  topic: Topic.nullish(),
  collaborators: Address.array().nullish(),
  reactions: Reaction.array().nullish(),
  ThreadVersionHistories: z.array(ThreadVersionHistory).nullish(),
});

export const ThreadRank = z.object({
  thread_id: PG_INT,
  community_rank: z.bigint(),
  global_rank: z.bigint(),
  updated_at: z.coerce.date().optional(),

  // associations
  Thread: Thread.optional(),
});
