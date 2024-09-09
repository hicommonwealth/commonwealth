import { z } from 'zod';
import { Reaction, Thread } from '../entities';
import { DiscordMetaSchema, PG_INT } from '../utils';

export const CanvasThread = z.object({
  community_id: z.string(),
  topic_id: PG_INT,
  title: z.string(),
  body: z.string(),
  canvas_signed_data: z.string().optional(),
  canvas_msg_id: z.string().optional(),
});

export const CreateThread = {
  input: CanvasThread.extend({
    kind: z.enum(['discussion', 'link']),
    stage: z.string(),
    url: z.string().optional(),
    read_only: z.boolean(),
    discord_meta: DiscordMetaSchema.optional(),
    canvas_signed_data: z.string().optional(),
    canvas_msg_id: z.string().optional(),
  }),
  output: Thread,
};

export const ThreadCanvasReaction = z.object({
  thread_id: PG_INT,
  thread_msg_id: z.string(),
  reaction: z.enum(['like']),
  canvas_signed_data: z.string().optional(),
  canvas_msg_id: z.string().optional(),
});

export const CreateThreadReaction = {
  input: ThreadCanvasReaction,
  output: Reaction.extend({ community_id: z.string() }),
};
