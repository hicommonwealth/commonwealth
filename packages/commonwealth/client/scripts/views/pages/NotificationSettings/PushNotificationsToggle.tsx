import React from 'react';
// eslint-disable-next-line max-len
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { useSubscriptionPreferenceSetting } from 'views/pages/NotificationSettings/useSubscriptionPreferenceSetting';
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

  const checked = useSubscriptionPreferenceSetting(pref);

  const [, activate] = useSubscriptionPreferenceSettingCallback(pref);

  if (checked == undefined) {
    return null;
  }

  return <CWToggle checked={checked} onChange={() => activate(!checked)} />;
};
