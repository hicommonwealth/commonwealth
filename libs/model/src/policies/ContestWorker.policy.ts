import { schemas, type Policy } from '@hicommonwealth/core';

const inputs = {
  ThreadCreated: schemas.events.ThreadCreated,
  CommentCreated: schemas.events.CommentCreated,
};

export const ContestWorker: Policy<typeof inputs> = () => ({
  inputs,
  body: {
    ThreadCreated: async ({ name, payload }) => {
      console.log(name, payload);
    },
    CommentCreated: async ({ name, payload }) => {
      console.log(name, payload);
    },
  },
});
