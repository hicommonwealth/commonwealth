import { schemas, type Policy } from '@hicommonwealth/core';
// FIXME tell prettier to NOT mangle imports and fix this with eslint so this
// can be disabled

const inputs = {
  ThreadCreated: schemas.events.ThreadCreated,
  CommentCreated: schemas.events.CommentCreated,
};

export const ContestWorker: Policy<typeof inputs> = () => ({
  inputs,
  body: {
    ThreadCreated: async ({ name, payload }) => {
      console.log(name, payload.thread);
    },
    CommentCreated: async ({ name, payload }) => {
      console.log(name, payload.comment);
    },
  },
});
