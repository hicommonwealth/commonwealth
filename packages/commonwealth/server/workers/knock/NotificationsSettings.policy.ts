import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { processSubscriptionPreferencesUpdated } from './subscriptionPreferencesUpdated';

const notificationSettingsInputs = {
  SubscriptionPreferencesUpdated: events.SubscriptionPreferencesUpdated,
};

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
