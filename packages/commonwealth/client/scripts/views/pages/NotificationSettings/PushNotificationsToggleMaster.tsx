import { useSubscriptionPreferenceSetting } from 'features/notifications/hooks/useSubscriptionPreferenceSetting';
// eslint-disable-next-line max-len
import { useSubscriptionPreferenceSettingToggle } from 'features/notifications/hooks/useSubscriptionPreferenceSettingToggle';
import React, { useCallback } from 'react';
// eslint-disable-next-line max-len
import { CWToggle } from 'views/components/component_kit/cw_toggle';

export const PushNotificationsToggleMaster = () => {
  const checked = useSubscriptionPreferenceSetting(
    'mobile_push_notifications_enabled',
  );

  const toggle = useSubscriptionPreferenceSettingToggle([
    'mobile_push_notifications_enabled',
    'mobile_push_discussion_activity_enabled',
    'mobile_push_admin_alerts_enabled',
  ]);

  const handleToggle = useCallback(
    (activate: boolean) => {
      async function doAsync() {
        await toggle(activate);
      }

      doAsync().catch(console.error);
    },
    [toggle],
  );

  return <CWToggle checked={checked} onChange={() => handleToggle(!checked)} />;
};
