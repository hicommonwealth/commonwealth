import { z } from 'zod';
import { PG_INT } from '../utils';
import { Reaction } from './reaction.schemas';
import { Thread } from './thread.schemas';
import { Address } from './user.schemas';

export const CommentVersionHistory = z.object({
  id: PG_INT.optional(),
  comment_id: PG_INT,
  text: z.string(),
  timestamp: z.date(),
  content_url: z.string().nullish(),
});

export const Comment = z.object({
  id: PG_INT.optional(),
  thread_id: PG_INT,
  address_id: PG_INT,
  text: z.string(),
  parent_id: z.string().nullish(),
  content_url: z.string().nullish(),

  canvas_signed_data: z.string().nullish(),
  canvas_msg_id: z.string().nullish(),

  created_by: z.string().nullish(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().nullish(),
  marked_as_spam_at: z.coerce.date().nullish(),

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
  reaction_weights_sum: z
    .string()
    .refine((str) => {
      return /^[0-9]+$/.test(str); // only numbers
    })
    .nullish(),
  search: z.union([z.string(), z.record(z.any())]),

  Address: Address.nullish(),
  Thread: Thread.nullish(),
  Reaction: Reaction.nullish(),
  CommentVersionHistories: z.array(CommentVersionHistory).nullish(),
});
