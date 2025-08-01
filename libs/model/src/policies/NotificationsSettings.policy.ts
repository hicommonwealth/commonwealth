import { notificationsProvider, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { processSubscriptionPreferencesUpdated } from '../services/knock/subscriptionPreferencesUpdated';

const notificationSettingsInputs = {
  SubscriptionPreferencesUpdated: events.SubscriptionPreferencesUpdated,
  UserCreated: events.UserCreated,
  UserUpdated: events.UserUpdated,
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
      UserCreated: async ({ payload }) => {
        if (payload.user.email) {
          await notificationsProvider().identifyUser({
            user_id: `${payload.user_id}`,
            user_properties: {
              email: payload.user.email,
            },
          });
        }
      },
      UserUpdated: async ({ payload }) => {
        const oldEmail = payload.old_user.email;
        const newEmail = payload.new_user.email;
        if (newEmail && newEmail !== oldEmail) {
          await notificationsProvider().identifyUser({
            user_id: `${payload.new_user.id!}`,
            user_properties: {
              email: newEmail,
            },
          });
        }
      },
    },
  };
}
