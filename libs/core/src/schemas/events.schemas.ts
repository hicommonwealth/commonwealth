import { z } from 'zod';

export const ThreadCreated = z.object({
  thread: z.string(),
  creator: z.string(),
});
export const ThreadUpvoted = z.object({
  thread: z.string(),
  voter: z.string(),
});
export const CommentCreated = z.object({ comment: z.string() });
export const GroupCreated = z.object({
  groupId: z.string(),
  userId: z.string(),
});
export const CommunityCreated = z.object({
  communityId: z.string(),
  userId: z.string(),
});
export const SnapshotProposalCreated = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  choices: z.array(z.string()).optional(),
  space: z.string().optional(),
  event: z.string().optional(),
  start: z.string().optional(),
  expire: z.string().optional(),
  token: z.string().optional(),
  secret: z.string().optional(),
});
export const DiscordMessageCreated = z.object({
  user: z
    .object({
      id: z.string(),
      username: z.string(),
    })
    .optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  message_id: z.string(),
  channel_id: z.string().optional(),
  parent_channel_id: z.string().optional(),
  guild_id: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  action: z.union([
    z.literal('thread-delete'),
    z.literal('thread-title-update'),
    z.literal('thread-body-update'),
    z.literal('thread-create'),
    z.literal('comment-delete'),
    z.literal('comment-update'),
    z.literal('comment-create'),
  ]),
});
