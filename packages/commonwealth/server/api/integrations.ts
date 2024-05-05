import { trpc } from '@hicommonwealth/adapters';
import { analytics, events, type Policy } from '@hicommonwealth/core';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';

const inputs = {
  GroupCreated: events.GroupCreated,
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
};

function Analytics(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      GroupCreated: ({ name, payload }) => {
        return Promise.resolve(
          analytics().track(MixpanelCommunityInteractionEvent.CREATE_GROUP, {
            name,
            ...payload,
          }),
        );
      },

      ThreadCreated: ({ name, payload }) => {
        return Promise.resolve(
          analytics().track(MixpanelCommunityInteractionEvent.CREATE_THREAD, {
            name,
            ...payload,
          }),
        );
      },

      CommentCreated: ({ name, payload }) => {
        return Promise.resolve(
          analytics().track(MixpanelCommunityInteractionEvent.CREATE_COMMENT, {
            name,
            ...payload,
          }),
        );
      },
    },
  };
}

export const trpcRouter = trpc.router({
  analytics: trpc.event(Analytics, trpc.Tag.Integration),
});
