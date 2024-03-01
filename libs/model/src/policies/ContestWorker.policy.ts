import { EventSchemas, PolicyMetadata, events } from '@hicommonwealth/core';

const schemas: EventSchemas = {
  ThreadCreated: events.schemas.ThreadCreated,
  CommentCreated: events.schemas.CommentCreated,
};

export const ContestWorker = (): PolicyMetadata<never, typeof schemas> => ({
  schemas,
  body: {
    ThreadCreated: async ({ name, payload }) => {
      console.log(name, payload.thread);
    },
    CommentCreated: async ({ name, payload }) => {
      console.log(name, payload.comment);
    },
  },
});
