import { useCallback } from 'react';
// eslint-disable-next-line max-len
import { useSubscriptionPreferences } from 'state/api/trpc/subscription/useSubscriptionPreferences';
// eslint-disable-next-line max-len
import { useUpdateSubscriptionPreferencesMutation } from 'state/api/trpc/subscription/useUpdateSubscriptionPreferencesMutation';
// eslint-disable-next-line max-len
import useUserStore from 'state/ui/user';
// eslint-disable-next-line max-len
import { useNotificationsRequestPermissionsAsyncReceiver } from 'views/components/PrivyMobile/useNotificationsRequestPermissionsAsyncReceiver';
import { SubscriptionPrefType } from 'views/pages/NotificationSettings/useSubscriptionPreferenceSetting';

export function useSubscriptionPreferenceSettingToggle(
  prefs: SubscriptionPrefType[],
) {
  const subscriptionPreferences = useSubscriptionPreferences();

  const requestPermissions = useNotificationsRequestPermissionsAsyncReceiver();

  const { mutateAsync: updateSubscriptionPreferences } =
    useUpdateSubscriptionPreferencesMutation();
  const user = useUserStore();

  return useCallback(
    async (activate: boolean) => {
      if (activate) {
        // *** we have to first request permissions if we're activating.
        const { status: notificationPermissions } = await requestPermissions(
          {},
        );
        if (notificationPermissions !== 'granted') {
          return;
        }
      }

      function createActivations() {
        const activations = {};
        for (const pref of prefs) {
          activations[pref] = activate;
        }
        return activations;
      }

      const activations = createActivations();

      // ** first we set the subscription preference
      await updateSubscriptionPreferences({
        id: user.id,
        ...subscriptionPreferences.data,
        ...activations,
      });

      await subscriptionPreferences.refetch();
    },
    [
      prefs,
      requestPermissions,
      subscriptionPreferences,
      updateSubscriptionPreferences,
      user.id,
    ],
  );
}
