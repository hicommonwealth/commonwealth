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
  SnapshotProposalCreated: z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    body: z.string().optional(),
    choices: z.array(z.string()).optional(),
    space: z.string().optional(),
    event: z.string().optional(),
    start: z.string().optional(),
    expire: z.string().optional(),
  }),
};

export type Events = keyof typeof schemas;
