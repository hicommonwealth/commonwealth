import React from 'react';
// eslint-disable-next-line max-len
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import {
  SubscriptionPrefType,
  useSubscriptionPreferenceSettingCallback,
} from 'views/pages/NotificationSettings/useSubscriptionPreferenceSettingCallback';

interface PushNotificationsToggleProps {
  readonly pref: SubscriptionPrefType;
}

export const PushNotificationsToggle = (
  props: PushNotificationsToggleProps,
) => {
  const { pref } = props;

  const [checked, activate] = useSubscriptionPreferenceSettingCallback(pref);

  return <CWToggle checked={checked} onChange={() => activate(!checked)} />;
};
