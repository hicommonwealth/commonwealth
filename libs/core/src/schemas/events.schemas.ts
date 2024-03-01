import { z } from 'zod';

export const schemas = {
  ThreadCreated: z.object({ thread: z.string() }),
  CommentCreated: z.object({ comment: z.string() }),
  GroupCreated: z.object({
    groupId: z.string(),
    userId: z.string(),
  }),
  CommunityCreated: z.object({
    communityId: z.string(),
    userId: z.string(),
  }),
};

export type Events = keyof typeof schemas;
