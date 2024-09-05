import { z } from 'zod';
import { Reaction, Thread } from '../entities';
import { DiscordMetaSchema, PG_INT } from '../utils';

export const CreateThread = {
  input: z.object({
    community_id: z.string(),
    topic_id: PG_INT,
    title: z.string(),
    body: z.string(),
    kind: z.enum(['discussion', 'link']),
    stage: z.string(),
    url: z.string().optional(),
    read_only: z.boolean(),
    discord_meta: DiscordMetaSchema.optional(),
    canvas_signed_data: z.string(),
    canvas_hash: z.string(),
  }),
  output: Thread,
};

// TODO: inherit from canvas thread
export const CreateThreadReaction = {
  input: z.object({
    thread_id: PG_INT,
    reaction: z.enum(['like']),
  }),
  output: Reaction,
};
