import { useCallback } from 'react';
// eslint-disable-next-line max-len
import { useSubscriptionPreferences } from 'state/api/trpc/subscription/useSubscriptionPreferences';
// eslint-disable-next-line max-len
import { useUpdateSubscriptionPreferencesMutation } from 'state/api/trpc/subscription/useUpdateSubscriptionPreferencesMutation';
// eslint-disable-next-line max-len
import useUserStore from 'state/ui/user';
import { SubscriptionPrefType } from 'views/pages/NotificationSettings/useSubscriptionPreferenceSetting';

export function useSubscriptionPreferenceSettingToggle(
  prefs: SubscriptionPrefType[],
) {
  const subscriptionPreferences = useSubscriptionPreferences();
  const { mutateAsync: updateSubscriptionPreferences } =
    useUpdateSubscriptionPreferencesMutation();
  const user = useUserStore();

  const requestPermissions = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied' as NotificationPermission;
    }

    if (Notification.permission === 'granted') {
      return Notification.permission;
    }

    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.error('Failed to request notification permissions', error);
      return Notification.permission;
    }
  }, []);

  return useCallback(
    async (activate: boolean) => {
      if (activate) {
        // We have to request permissions if we're activating.
        const notificationPermission = await requestPermissions();
        if (notificationPermission !== 'granted') {
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
