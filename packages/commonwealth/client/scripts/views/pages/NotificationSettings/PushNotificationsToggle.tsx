import { BrowserType, getBrowserType } from 'helpers/browser';
import React, { useCallback, useState } from 'react';
// eslint-disable-next-line max-len
import { useRegisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useRegisterClientRegistrationTokenMutation';
// eslint-disable-next-line max-len
import { useUnregisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useUnregisterClientRegistrationTokenMutation';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { getFirebaseMessagingToken } from 'views/pages/NotificationSettings/getFirebaseMessagingToken';

const LOCAL_STORAGE_KEY = 'pushNotificationsEnabled';

function computeChannelTypeFromBrowserType(
  browserType: BrowserType | undefined,
): 'FCM' | 'APNS' | undefined {
  switch (browserType) {
    case 'safari':
      return 'APNS';
    case 'chrome':
      return 'FCM';
  }

  return undefined;
}

export const PushNotificationsToggle = () => {
  const registerClientRegistrationToken =
    useRegisterClientRegistrationTokenMutation();

  const unregisterClientRegistrationToken =
    useUnregisterClientRegistrationTokenMutation();

  const browserType = getBrowserType();
  const channelType = computeChannelTypeFromBrowserType(browserType);

  const [checked, setChecked] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEY) === 'on',
  );

  const handleButtonToggle = useCallback((newValue: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, newValue ? 'on' : 'off');
    setChecked(newValue);
  }, []);

  const handleRegisterPushNotificationSubscription = useCallback(() => {
    async function doAsync() {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const token = await getFirebaseMessagingToken();
        await registerClientRegistrationToken.mutateAsync({
          id: 'none',
          token,
          channelType,
        });
      }
    }

    doAsync().catch(console.error);
  }, [channelType, registerClientRegistrationToken]);

  const handleUnregisterPushNotificationSubscription = useCallback(() => {
    async function doAsync() {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const token = await getFirebaseMessagingToken();
        await unregisterClientRegistrationToken.mutateAsync({
          id: 'none',
          token,
          channelType,
        });
      }
    }

    doAsync().catch(console.error);
  }, [channelType, unregisterClientRegistrationToken]);

  const handleRegistration = useCallback(
    (newValue: boolean) => {
      if (newValue) {
        handleRegisterPushNotificationSubscription();
      } else {
        handleUnregisterPushNotificationSubscription();
      }
    },
    [
      handleRegisterPushNotificationSubscription,
      handleUnregisterPushNotificationSubscription,
    ],
  );

  const handleChecked = useCallback(
    (newValue: boolean) => {
      handleButtonToggle(newValue);
      handleRegistration(newValue);
    },
    [handleButtonToggle, handleRegistration],
  );

  return (
    <CWToggle checked={checked} onChange={() => handleChecked(!checked)} />
  );
};
