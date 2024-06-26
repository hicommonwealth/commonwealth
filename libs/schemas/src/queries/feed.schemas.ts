import { Comment, Thread } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const ThreadFeed = {
  input: z.object({}),
  output: z
    .object({
      thread: Thread,
      recentComments: Comment.array(),
    })
    .array(),
};
