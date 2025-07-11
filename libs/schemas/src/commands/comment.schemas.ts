import { z } from 'zod';
import { CommentContext, ThreadContext } from '../context';
import { Comment, Reaction } from '../entities';
import { DiscordMetaSchema, PG_INT } from '../utils';

export const CanvasComment = z.object({
  thread_id: PG_INT,
  thread_msg_id: z.string().nullish(),
  body: z.string().min(1),
  parent_id: PG_INT.optional(),
  parent_msg_id: z.string().nullish(),
  canvas_signed_data: z.string().optional(),
  canvas_msg_id: z.string().optional(),
});

export const CreateComment = {
  input: CanvasComment.extend({
    discord_meta: DiscordMetaSchema.optional(),
    turnstile_token: z.string().nullish(),
  }),
  output: Comment.extend({ community_id: z.string() }),
  context: ThreadContext,
};

export const UpdateComment = {
  input: z.object({
    comment_id: PG_INT,
    body: z.string().min(1),
    canvas_signed_data: z.string().optional(),
    canvas_msg_id: z.string().optional(),
  }),
  output: Comment.extend({ community_id: z.string() }),
  context: CommentContext,
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
  context: CommentContext,
};

export const DeleteComment = {
  input: z.object({
    comment_id: PG_INT,
  }),
  output: z.object({
    thread_id: PG_INT,
    comment_id: PG_INT,
    community_id: z.string(),
    body: z.string().optional(),
    marked_as_spam_at: z.date().nullish(),
    user_tier_at_creation: z.number().nullish(),
    canvas_signed_data: z.string().nullish(),
    canvas_msg_id: z.string().nullish(),
  }),
  context: CommentContext,
};

export const ToggleCommentSpam = {
  input: z.object({
    comment_id: PG_INT,
    spam: z.boolean(),
  }),
  output: Comment.extend({
    community_id: z.string(),
    spam_toggled: z.boolean(),
  }),
  context: CommentContext,
};
