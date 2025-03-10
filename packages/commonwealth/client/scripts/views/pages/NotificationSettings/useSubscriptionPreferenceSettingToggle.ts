import { useCallback } from 'react';
// eslint-disable-next-line max-len
import { useSubscriptionPreferences } from 'state/api/trpc/subscription/useSubscriptionPreferences';
// eslint-disable-next-line max-len
import { useUpdateSubscriptionPreferencesMutation } from 'state/api/trpc/subscription/useUpdateSubscriptionPreferencesMutation';
// eslint-disable-next-line max-len
import useUserStore from 'state/ui/user';
// eslint-disable-next-line max-len
import { SubscriptionPrefType } from 'views/pages/NotificationSettings/useSubscriptionPreferenceSetting';
import { verifyMobileNotificationPermissions } from './verifyMobileNotificationPermissions';

export function useSubscriptionPreferenceSettingToggle(
  prefs: SubscriptionPrefType[],
) {
  const subscriptionPreferences = useSubscriptionPreferences();
  const { mutateAsync: updateSubscriptionPreferences } =
    useUpdateSubscriptionPreferencesMutation();
  const user = useUserStore();

  return useCallback(
    (activate: boolean) => {
      async function doAsync() {
        if (activate) {
          // *** we have to first request permissions if we're activating.
          const verified = await verifyMobileNotificationPermissions();
          if (!verified) {
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
      }

      doAsync().catch(console.error);
    },
    [prefs, subscriptionPreferences, updateSubscriptionPreferences, user.id],
  );
}
