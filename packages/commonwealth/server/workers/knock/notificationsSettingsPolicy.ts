import { events, Policy } from '@hicommonwealth/core';
import { processSubscriptionPreferencesUpdated } from './eventHandlers/subscriptionPreferencesUpdated';

const notificationSettingsInputs = {
  SubscriptionPreferencesUpdated: events.SubscriptionPreferencesUpdated,
};

export function NotificationsSettingsPolicy(): Policy<
  typeof notificationSettingsInputs
> {
  return {
    inputs: notificationSettingsInputs,
    body: {
      // eslint-disable-next-line @typescript-eslint/require-await
      SubscriptionPreferencesUpdated: async (event) => {
        await processSubscriptionPreferencesUpdated(event);
      },
    },
  };
}
