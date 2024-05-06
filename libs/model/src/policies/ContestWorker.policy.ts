import { events, type Policy } from '@hicommonwealth/core';

const inputs = {
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
};

export function ContestWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ name, payload }) => {
        console.log(name, payload);
      },
      CommentCreated: async ({ name, payload }) => {
        console.log(name, payload);
      },
    },
  };
}
