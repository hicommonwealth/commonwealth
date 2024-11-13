import { z } from 'zod';
import { ReactionContext, ThreadContext, TopicContext } from '../context';
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
    topic_id: PG_INT,
    kind: z.enum(['discussion', 'link']),
    stage: z.string(),
    url: z.string().optional(),
    read_only: z.boolean(),
    discord_meta: DiscordMetaSchema.optional(),
    canvas_signed_data: z.string().optional(),
    canvas_msg_id: z.string().optional(),
  }),
  output: Thread,
  context: TopicContext,
};

export const UpdateThread = {
  input: z.object({
    thread_id: PG_INT,
    body: z.string().optional(),
    title: z.string().optional(),
    topic_id: PG_INT.optional(),
    stage: z.string().optional(),
    url: z.string().url().optional(),
    locked: z.boolean().optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
    spam: z.boolean().optional(),
    collaborators: z
      .object({
        toAdd: z.array(PG_INT).optional(),
        toRemove: z.array(PG_INT).optional(),
      })
      .optional(),
    canvas_signed_data: z.string().optional(),
    canvas_msg_id: z.string().optional(),
  }),
  output: Thread,
  context: ThreadContext,
};

export const ThreadCanvasReaction = z.object({
  thread_id: PG_INT,
  thread_msg_id: z.string().nullish(),
  reaction: z.enum(['like']),
  canvas_signed_data: z.string().optional(),
  canvas_msg_id: z.string().optional(),
});

export const CreateThreadReaction = {
  input: ThreadCanvasReaction,
  output: Reaction.extend({ community_id: z.string() }),
  context: ThreadContext,
};

export const DeleteThread = {
  input: z.object({
    thread_id: PG_INT,
    canvas_signed_data: z.string().optional(),
    canvas_msg_id: z.string().optional(),
  }),
  output: z.object({
    thread_id: PG_INT,
    canvas_signed_data: z.string().nullish(),
    canvas_msg_id: z.string().nullish(),
  }),
  context: ThreadContext,
};

export const DeleteReaction = {
  input: z.object({
    community_id: z.string(),
    reaction_id: PG_INT,
    canvas_signed_data: z.string().optional(),
    canvas_msg_id: z.string().optional(),
  }),
  output: z.boolean(),
  context: ReactionContext,
};
