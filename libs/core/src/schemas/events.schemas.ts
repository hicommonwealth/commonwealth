import { z } from 'zod';

export const schemas = {
  ThreadCreated: z.object({ thread: z.string() }),
  CommentCreated: z.object({ comment: z.string() }),
};

export type Events = keyof typeof schemas;
