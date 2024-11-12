import { z } from 'zod';
import { Address, Comment, Reaction, Thread, Topic } from './entities';

// Input schemas for authorization context
export const AuthContextInput = z.object({ community_id: z.string() });
export const TopicContextInput = z.object({ topic_id: z.number() });
export const ThreadContextInput = z.object({ thread_id: z.number() });
export const CommentContextInput = z.object({ comment_id: z.number() });
export const ReactionContextInput = z.object({
  community_id: z.string(),
  reaction_id: z.number(),
});

/**
 * Base authorization context
 * - Authorizes address in community, loading address instance
 * - Fills in author_address_id and other properties based on payload
 */
export const AuthContext = z.object({
  address: Address,
  community_id: z.string(),
  is_author: z.boolean(),
  author_address_id: z.number().optional(),
  is_collaborator: z.boolean().optional(),
});
export type AuthContext = z.infer<typeof AuthContext>;

/**
 * Topic authorization context
 * - Loads topic instance
 * - Fills in community_id
 */
export const TopicContext = z.object({
  ...AuthContext.shape,
  ...TopicContextInput.shape,
  community_id: z.string(),
  topic: Topic,
});
export type TopicContext = z.infer<typeof TopicContext>;

/**
 * Thread authorization context
 * - Loads thread instance
 * - Fills in community_id, topic_id
 */
export const ThreadContext = z.object({
  ...AuthContext.shape,
  ...ThreadContextInput.shape,
  community_id: z.string(),
  topic_id: z.number().optional(),
  thread: Thread,
});
export type ThreadContext = z.infer<typeof ThreadContext>;

/**
 * Comment authorization context
 * - Loads comment instance
 * - Fills in community_id, topic_id, thread_id
 */
export const CommentContext = z.object({
  ...AuthContext.shape,
  ...CommentContextInput.shape,
  community_id: z.string(),
  topic_id: z.number().optional(),
  thread_id: z.number(),
  comment: Comment,
});
export type CommentContext = z.infer<typeof CommentContext>;

/**
 * Reaction authorization context
 * - Loads reaction instance
 */
export const ReactionContext = z.object({
  ...AuthContext.shape,
  ...ReactionContextInput.shape,
  reaction: Reaction,
});
export type ReactionContext = z.infer<typeof ReactionContext>;
