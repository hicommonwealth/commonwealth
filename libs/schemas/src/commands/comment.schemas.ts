import { z } from 'zod';
import { Comment, Reaction } from '../entities';
import { DiscordMetaSchema, PG_INT } from '../utils';

export const CanvasComment = z.object({
  thread_id: PG_INT,
  thread_msg_id: z.string().nullish(),
  text: z.string().min(1),
  parent_id: PG_INT.optional(),
  parent_msg_id: z.string().nullish(),
  canvas_signed_data: z.string().optional(),
  canvas_msg_id: z.string().optional(),
});

export const CreateComment = {
  input: CanvasComment.extend({
    discord_meta: DiscordMetaSchema.optional(),
  }),
  output: Comment.extend({ community_id: z.string() }),
};

export const UpdateComment = {
  input: z.object({
    comment_id: PG_INT,
    text: z.string().min(1),
  }),
  output: Comment.extend({ community_id: z.string() }),
};

export const CommentCanvasReaction = z.object({
  comment_id: PG_INT,
  comment_msg_id: z.string().nullish(),
  reaction: z.enum(['like']),
  canvas_signed_data: z.string().optional(),
  canvas_msg_id: z.string().optional(),
});

export const CreateCommentReaction = {
  input: CommentCanvasReaction,
  output: Reaction.extend({ community_id: z.string() }),
};

export const DeleteComment = {
  input: z.object({
    comment_id: PG_INT,
  }),
  output: z.object({
    comment_id: PG_INT,
    canvas_signed_data: z.string().nullish(),
    canvas_msg_id: z.string().nullish(),
  }),
};
