import { PolicyMetadata } from '@hicommonwealth/core';
import { z } from 'zod';

const schemas = {
  ThreadCreated: z.object({ thread: z.string() }),
  CommentCreated: z.object({ command: z.string() }),
};

export const ContestWorker = (): PolicyMetadata<never, typeof schemas> => ({
  schemas,
  body: {
    ThreadCreated: async ({ payload }) => {
      console.log(payload);
    },
    CommentCreated: async ({ payload }) => {
      console.log(payload);
    },
  },
});
