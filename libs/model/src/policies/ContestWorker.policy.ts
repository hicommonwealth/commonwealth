import { schemas, type Policy } from '@hicommonwealth/core';

const inputs = {
  ThreadCreated: schemas.events.ThreadCreated,
  ThreadUpvoted: schemas.events.ThreadUpvoted,
  CommentCreated: schemas.events.CommentCreated,
};

export const ContestWorker: Policy<typeof inputs> = () => ({
  inputs,
  body: {
    ThreadCreated: async ({ name, payload }) => {
      console.log(name, payload.thread);
    },
    ThreadUpvoted: async ({ name, payload }) => {
      console.log(name, payload.thread);
    },
    CommentCreated: async ({ name, payload }) => {
      console.log(name, payload.comment);
    },
  },
});
