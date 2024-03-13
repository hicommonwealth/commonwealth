import { PolicyMetadata, schemas } from '@hicommonwealth/core';

const inputs = {
  ThreadCreated: schemas.events.ThreadCreated,
  CommentCreated: schemas.events.CommentCreated,
};

export const ContestWorker = (): PolicyMetadata<typeof inputs> => ({
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
