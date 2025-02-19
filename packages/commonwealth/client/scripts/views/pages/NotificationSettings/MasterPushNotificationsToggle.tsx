import React, { useCallback } from 'react';
// eslint-disable-next-line max-len
import { useUpdateSubscriptionPreferencesMutation } from 'state/api/trpc/subscription/useUpdateSubscriptionPreferencesMutation';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { useSubscriptionPreferenceSettingCallback } from 'views/pages/NotificationSettings/useSubscriptionPreferenceSettingCallback';
import { verifyMobileNotificationPermissions } from 'views/pages/NotificationSettings/verifyMobileNotificationPermissions';

export const MasterPushNotificationsToggle = () => {
  const [checked] = useSubscriptionPreferenceSettingCallback(
    'mobile_push_notifications_enabled',
  );

  const { mutateAsync: updateSubscriptionPreferences } =
    useUpdateSubscriptionPreferencesMutation();

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

  function changeSetting(newValue: boolean) {
    toggle(newValue);
  }

  console.log('FIXME: MasterPushNotificationsToggle = ' + checked);

  return (
    <CWToggle checked={checked} onChange={() => changeSetting(!checked)} />
  );
};
