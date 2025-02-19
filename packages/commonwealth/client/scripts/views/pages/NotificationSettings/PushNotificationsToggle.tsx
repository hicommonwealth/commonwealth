import React from 'react';
// eslint-disable-next-line max-len
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import {
  SubscriptionPrefType,
  useSubscriptionPreferenceSetting,
} from 'views/pages/NotificationSettings/useSubscriptionPreferenceSetting';
import { useSubscriptionPreferenceSettingToggle } from 'views/pages/NotificationSettings/useSubscriptionPreferenceSettingToggle';

interface PushNotificationsToggleProps {
  readonly pref: SubscriptionPrefType;
}

export const PushNotificationsToggle = (
  props: PushNotificationsToggleProps,
) => {
  const { pref } = props;

  const mobile_push_notifications_enabled = useSubscriptionPreferenceSetting(
    'mobile_push_notifications_enabled',
  );

  const checked = useSubscriptionPreferenceSetting(pref);

  const toggle = useSubscriptionPreferenceSettingToggle([pref]);

  return (
    <CWToggle
      checked={checked}
      onChange={() => toggle(!checked)}
      disabled={!mobile_push_notifications_enabled}
    />
  );
};
