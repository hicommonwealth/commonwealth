import { z } from 'zod';
import { Comment } from '../entities';
import { DiscordMetaSchema, PG_INT } from '../utils';

export const CanvasComment = z.object({
  thread_id: PG_INT,
  text: z.string().trim().min(1),
  parent_id: PG_INT.optional(),
  canvas_signed_data: z.string().optional(),
  canvas_hash: z.string().optional(),
});

export const CreateComment = {
  input: CanvasComment.extend({
    discord_meta: DiscordMetaSchema.optional(),
  }),
  output: Comment.extend({ community_id: z.string() }),
};
