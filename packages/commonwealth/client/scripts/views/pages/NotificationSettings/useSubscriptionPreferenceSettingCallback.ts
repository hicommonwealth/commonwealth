import { useCallback } from 'react';
import { useSubscriptionPreferences } from 'state/api/trpc/subscription/useSubscriptionPreferences';
import { useUpdateSubscriptionPreferencesMutation } from 'state/api/trpc/subscription/useUpdateSubscriptionPreferencesMutation';
import useUserStore from 'state/ui/user';
import { usePushNotificationActivated } from 'views/pages/NotificationSettings/usePushNotificationActivated';
import { usePushNotificationToggleCallback } from 'views/pages/NotificationSettings/usePushNotificationToggleCallback';

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

export function useSubscriptionPreferenceSettingCallback(
  pref: SubscriptionPrefType,
): UseSubscriptionPreferenceSettingCallbackResult {
  const subscriptionPreferences = useSubscriptionPreferences();
  const { mutateAsync: updateSubscriptionPreferences } =
    useUpdateSubscriptionPreferencesMutation();
  const pushNotificationToggleCallback = usePushNotificationToggleCallback();
  const [pushNotificationActivated, togglePushNotificationActivated] =
    usePushNotificationActivated();
  const user = useUserStore();

  const toggle = useCallback(
    (activate: boolean) => {
      async function doAsync() {
        await pushNotificationToggleCallback(activate);

        await updateSubscriptionPreferences({
          id: user.id,
          ...subscriptionPreferences.data,
          [pref]: activate,
        });
        togglePushNotificationActivated(true);
      }

      doAsync().catch(console.error);
    },
    [
      pref,
      pushNotificationToggleCallback,
      subscriptionPreferences.data,
      togglePushNotificationActivated,
      updateSubscriptionPreferences,
      user.id,
    ],
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
    pushNotificationActivated && computeSubscriptionPreferenceActivated(),
    toggle,
  ];
}
