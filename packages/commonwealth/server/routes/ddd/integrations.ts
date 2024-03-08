import { trpc } from '@hicommonwealth/adapters';
import { analytics, events, type Policy } from '@hicommonwealth/core';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';

const inputs = {
  GroupCreated: events.schemas.GroupCreated,
  ThreadCreated: events.schemas.ThreadCreated,
  CommentCreated: events.schemas.CommentCreated,
};

const Analytics: Policy<typeof inputs> = () => ({
  inputs,
  body: {
    GroupCreated: async ({ name, payload }) => {
      analytics().track(MixpanelCommunityInteractionEvent.CREATE_GROUP, {
        name,
        ...payload,
      });
    },

    ThreadCreated: async ({ name, payload }) => {
      analytics().track(MixpanelCommunityInteractionEvent.CREATE_THREAD, {
        name,
        ...payload,
      });
    },

    CommentCreated: async ({ name, payload }) => {
      analytics().track(MixpanelCommunityInteractionEvent.CREATE_COMMENT, {
        name,
        ...payload,
      });
    },
  },
});

export const trpcRouter = trpc.router({
  analytics: trpc.event(Analytics, trpc.Tag.Integration),
});
