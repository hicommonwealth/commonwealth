import { z } from 'zod';
import { discordMetaSchema, linksSchema, PG_INT, zDate } from '../utils';
import { Address } from './user.schemas';

export const Thread = z.object({
  Address: Address.nullish(),
  address_id: PG_INT,
  title: z.string(),
  kind: z.string(),
  stage: z.string(),
  id: PG_INT.nullish(),
  body: z.string().nullish(),
  plaintext: z.string().nullish(),
  url: z.string().nullish(),
  topic_id: PG_INT.nullish(),
  pinned: z.boolean().nullish(),
  community_id: z.string(),
  view_count: PG_INT,
  links: z.object(linksSchema).array().nullish(),

  read_only: z.boolean().nullish(),
  version_history: z.array(z.string()).nullish(),

  has_poll: z.boolean().nullish(),

  canvas_signed_data: z.string().nullish(),
  canvas_hash: z.string().nullish(),

  created_at: zDate.nullish(),
  updated_at: zDate.nullish(),
  last_edited: zDate.nullish(),
  deleted_at: zDate.nullish(),
  last_commented_on: zDate.nullish(),
  marked_as_spam_at: zDate.nullish(),
  archived_at: zDate.nullish(),
  locked_at: zDate.nullish(),
  discord_meta: z.object(discordMetaSchema).nullish(),

  //counts
  reaction_count: PG_INT,
  reaction_weights_sum: PG_INT,
  comment_count: PG_INT,

  activity_rank_date: zDate.nullish(),

  //notifications
  max_notif_id: PG_INT,

  created_by: z.string().nullish(),
  profile_name: z.string().nullish(),
});

export const ThreadVersionHistory = z.object({
  id: PG_INT.optional(),
  thread_id: PG_INT,
  address: z
    .string()
    .describe('Address of the creator of the post or the collaborator'),
  body: z.string(),
  timestamp: z.date(),
});
