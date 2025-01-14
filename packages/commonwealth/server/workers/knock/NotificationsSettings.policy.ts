import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { processSubscriptionPreferencesUpdated } from './subscriptionPreferencesUpdated';

const notificationSettingsInputs = {
  SubscriptionPreferencesUpdated: events.SubscriptionPreferencesUpdated,
};

// TODO: this should be in libs/model, but currently depending on libs/adapter for config
export function NotificationsSettingsPolicy(): Policy<
  typeof notificationSettingsInputs
> {
  return {
    inputs: notificationSettingsInputs,
    body: {
      SubscriptionPreferencesUpdated: async (event) => {
        await processSubscriptionPreferencesUpdated(event);
      },
    },
  };
}
