import { z } from 'zod';
import { PG_INT, discordMetaSchema, linksSchema } from '../utils';
import { Address } from './user.schemas';

export const Thread = z.object({
  Address: Address.optional(),
  address_id: PG_INT,
  title: z.string(),
  kind: z.string(),
  stage: z.string(),
  id: PG_INT.optional(),
  body: z.string().optional(),
  plaintext: z.string().optional(),
  url: z.string().optional(),
  topic_id: PG_INT.optional(),
  pinned: z.boolean().optional(),
  community_id: z.string(),
  view_count: PG_INT,
  links: z.object(linksSchema).array().optional(),

  read_only: z.boolean().optional(),
  version_history: z.array(z.string()).optional(),

  has_poll: z.boolean().optional(),

  canvas_action: z.string(),
  canvas_session: z.string(),
  canvas_hash: z.string(),

  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  last_edited: z.date().optional(),
  deleted_at: z.date().optional(),
  last_commented_on: z.date().optional(),
  marked_as_spam_at: z.date().optional(),
  archived_at: z.date().optional(),
  locked_at: z.date().optional(),
  discord_meta: z.object(discordMetaSchema).optional(),

  //counts
  reaction_count: PG_INT,
  reaction_weights_sum: PG_INT,
  comment_count: PG_INT,

  //notifications
  max_notif_id: PG_INT,

  profile_name: z.string(),
});

export const Comment = z.object({
  thread_id: PG_INT,
  address_id: PG_INT,
  text: z.string(),
  plaintext: z.string(),
  id: PG_INT.optional(),
  community_id: z.string(),
  parent_id: z.string().nullish(),
  version_history: z.array(z.string()).optional(),

  canvas_action: z.string(),
  canvas_session: z.string(),
  canvas_hash: z.string(),

  created_at: z.any(),
  updated_at: z.any(),
  deleted_at: z.any(),
  marked_as_spam_at: z.any(),

  discord_meta: z
    .object({
      user: z.object({
        id: z.string(),
        username: z.string(),
      }),
      channel_id: z.string(),
      message_id: z.string(),
    })
    .nullish(),

  reaction_count: PG_INT,
  reaction_weights_sum: PG_INT.optional(),

  Address: Address.optional(),
});
