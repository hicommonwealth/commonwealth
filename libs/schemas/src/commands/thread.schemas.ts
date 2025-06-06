import { z } from 'zod/v4';
import { ReactionContext, ThreadContext, TopicContext } from '../context';
import { COMMUNITY_TIER, Link, Reaction, Thread } from '../entities';
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
    is_linking_token: z.boolean().optional(),
    turnstile_token: z.string().nullish(),
  }),
  output: Thread.extend({ community_tier: COMMUNITY_TIER }),
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
    is_linking_token: z.boolean().optional(),
    launchpad_token_address: z.string().nullish(),
  }),
  output: Thread.extend({ spam_toggled: z.boolean() }),
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
  output: Reaction.extend({
    community_id: z.string(),
    thread_id: PG_INT,
  }),
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
    community_id: z.string(),
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
  output: Reaction,
  context: ReactionContext,
};

export const AddLinks = {
  input: z.object({
    thread_id: PG_INT,
    links: z.array(Link),
  }),
  output: Thread.extend({
    new_links: z.array(Link),
  }),
  context: ThreadContext,
};

export const DeleteLinks = {
  input: z.object({
    thread_id: PG_INT,
    links: z.array(Link),
  }),
  output: Thread,
  context: ThreadContext,
};
