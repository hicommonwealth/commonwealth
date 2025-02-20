import React from 'react';
// eslint-disable-next-line max-len
import { CWToggle } from 'views/components/component_kit/cw_toggle';
// eslint-disable-next-line max-len
import { useSubscriptionPreferenceSettingToggle } from 'views/pages/NotificationSettings/useSubscriptionPreferenceSettingToggle';
// eslint-disable-next-line max-len
import { useSubscriptionPreferenceSetting } from './useSubscriptionPreferenceSetting';

export const PushNotificationsToggleMaster = () => {
  const checked = useSubscriptionPreferenceSetting(
    'mobile_push_notifications_enabled',
  );

  const toggle = useSubscriptionPreferenceSettingToggle([
    'mobile_push_notifications_enabled',
    'mobile_push_discussion_activity_enabled',
    'mobile_push_admin_alerts_enabled',
  ]);

  return <CWToggle checked={checked} onChange={() => toggle(!checked)} />;
};
