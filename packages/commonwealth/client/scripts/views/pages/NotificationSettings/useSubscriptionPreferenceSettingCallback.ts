import { useCallback } from 'react';
// eslint-disable-next-line max-len
import { useSubscriptionPreferences } from 'state/api/trpc/subscription/useSubscriptionPreferences';
// eslint-disable-next-line max-len
import { useUpdateSubscriptionPreferencesMutation } from 'state/api/trpc/subscription/useUpdateSubscriptionPreferencesMutation';
// eslint-disable-next-line max-len
import useUserStore from 'state/ui/user';
import { verifyMobileNotificationPermissions } from './verifyMobileNotificationPermissions';

/**
 * Return a boolean indicating if we're active, and a callback to toggle
 * the activation.
 */
type UseSubscriptionPreferenceSettingCallbackResult = Readonly<
  [boolean, (activate: boolean) => void]
>;

export type SubscriptionPrefType =
  | 'mobile_push_notifications_enabled'
  | 'mobile_push_discussion_activity_enabled'
  | 'mobile_push_admin_alerts_enabled';

/**
 * @deprecated
 */
export function useSubscriptionPreferenceSettingCallback(
  pref: SubscriptionPrefType,
): UseSubscriptionPreferenceSettingCallbackResult {
  const subscriptionPreferences = useSubscriptionPreferences();
  const { mutateAsync: updateSubscriptionPreferences } =
    useUpdateSubscriptionPreferencesMutation();
  const user = useUserStore();

  const toggle = useCallback(
    (activate: boolean) => {
      async function doAsync() {
        if (activate) {
          // *** we have to first request permissions if we're activating.
          const verified = await verifyMobileNotificationPermissions();
          if (!verified) {
            return;
          }
        }

        // ** first we set the subscription preference
        await updateSubscriptionPreferences({
          id: user.id,
          ...subscriptionPreferences.data,
          [pref]: activate,
        });

        await subscriptionPreferences.refetch();
      }

      doAsync().catch(console.error);
    },
    [pref, subscriptionPreferences, updateSubscriptionPreferences, user.id],
  );

  function computeSubscriptionPreferenceActivated() {
    if (subscriptionPreferences.data) {
      // NOTE: trpc types are mangled again for some reason. I'm not sure why
      // because useSubscriptionPreferences looks just like other hooks we've
      // been using.  I verified this typing is correct manually.  We will have
      // to look into why tRPC keeps mangling our types.
      return subscriptionPreferences.data[pref] as boolean;
    } else {
      return false;
    }
  }

  return [
    // the local device has to be and the feature toggle has to be on.
    computeSubscriptionPreferenceActivated(),
    toggle,
  ];
}
