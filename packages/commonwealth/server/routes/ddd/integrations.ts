import { trpc } from '@hicommonwealth/adapters';
import {
  analytics,
  events,
  type EventSchemas,
  type PolicyMetadata,
} from '@hicommonwealth/core';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';

const schemas: EventSchemas = {
  GroupCreated: events.schemas.GroupCreated,
};

const Analytics: () => PolicyMetadata<never, typeof schemas> = () => ({
  schemas,
  body: {
    GroupCreated: async ({ name, payload }) => {
      analytics().track(MixpanelCommunityInteractionEvent.CREATE_GROUP, {
        name,
        ...payload,
      });
    },
  },
});

export const trpcRouter = trpc.router({
  analytics: trpc.event(Analytics, trpc.Tag.Integration),
});
