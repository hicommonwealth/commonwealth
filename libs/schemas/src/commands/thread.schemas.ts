import { z } from 'zod';
import { Thread } from '../entities';
import { DiscordMetaSchema, PG_INT } from '../utils';

export const CreateThread = {
  input: z.object({
    id: PG_INT,
    community_id: z.string(),
    topic_id: PG_INT,
    title: z.string(),
    body: z.string(),
    kind: z.enum(['discussion', 'link']),
    stage: z.string(),
    url: z.string().optional(),
    read_only: z.boolean(),
    discord_meta: DiscordMetaSchema.optional(),
    canvas_signed_data: z.string().nullish(),
    canvas_msg_id: z.string().nullish(),
  }),
  output: Thread,
};
