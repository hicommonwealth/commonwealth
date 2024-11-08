import { z } from 'zod';
import { Address, Comment, Reaction, Thread, Topic } from './entities';

// Input schemas for authorization context
export const AuthInputSchema = z.object({
  community_id: z.string(),
});
export const TopicAuthInputSchema = z.object({ topic_id: z.number() });
export const ThreadAuthInputSchema = z.object({ thread_id: z.number() });
export const CommentAuthInputSchema = z.object({ comment_id: z.number() });
export const ReactionAuthInputSchema = z.object({
  community_id: z.string(),
  reaction_id: z.number(),
});

export type AuthInput = z.infer<typeof AuthInputSchema>;
export type TopicAuthInput = z.infer<typeof TopicAuthInputSchema>;
export type ThreadAuthInput = z.infer<typeof ThreadAuthInputSchema>;
export type CommentAuthInput = z.infer<typeof CommentAuthInputSchema>;
export type ReactionAuthInput = z.infer<typeof ReactionAuthInputSchema>;

/**
 * Base authorization context
 * - Authorizes address in community, loading address instance
 * - Fills in author_address_id and other properties based on payload
 */
export const AuthContextSchema = z.object({
  address: Address,
  community_id: z.string(),
  is_author: z.boolean(),
  author_address_id: z.number().optional(),
  is_collaborator: z.boolean().optional(),
});
export type AuthContext = z.infer<typeof AuthContextSchema>;

/**
 * Topic authorization context
 * - Loads topic instance
 * - Fills in community_id
 */
export const TopicAuthContextSchema = z.object({
  ...AuthContextSchema.shape,
  ...TopicAuthInputSchema.shape,
  community_id: z.string(),
  topic: Topic,
});
export type TopicAuthContext = z.infer<typeof TopicAuthContextSchema>;

/**
 * Thread authorization context
 * - Loads thread instance
 * - Fills in community_id, topic_id
 */
export const ThreadAuthContextSchema = z.object({
  ...AuthContextSchema.shape,
  ...ThreadAuthInputSchema.shape,
  community_id: z.string(),
  topic_id: z.number().optional(),
  thread: Thread,
});
export type ThreadAuthContext = z.infer<typeof ThreadAuthContextSchema>;

/**
 * Comment authorization context
 * - Loads comment instance
 * - Fills in community_id, topic_id, thread_id
 */
export const CommentAuthContextSchema = z.object({
  ...AuthContextSchema.shape,
  ...CommentAuthInputSchema.shape,
  community_id: z.string(),
  topic_id: z.number().optional(),
  thread_id: z.number(),
  comment: Comment,
});
export type CommentAuthContext = z.infer<typeof CommentAuthContextSchema>;

/**
 * Reaction authorization context
 * - Loads reaction instance
 */
export const ReactionAuthContextSchema = z.object({
  ...AuthContextSchema.shape,
  ...ReactionAuthInputSchema.shape,
  reaction: Reaction,
});
export type ReactionAuthContext = z.infer<typeof ReactionAuthContextSchema>;
