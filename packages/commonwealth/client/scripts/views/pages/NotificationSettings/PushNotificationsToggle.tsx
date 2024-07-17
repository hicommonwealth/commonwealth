import React, { useCallback, useState } from 'react';
import { useRegisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useRegisterClientRegistrationTokenMutation';
import { useUnregisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useUnregisterClientRegistrationTokenMutation';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { getFirebaseMessagingToken } from 'views/pages/NotificationSettings/getFirebaseMessagingToken';

const LOCAL_STORAGE_KEY = 'pushNotificationsEnabled';

export const PushNotificationsToggle = () => {
  const registerClientRegistrationToken =
    useRegisterClientRegistrationTokenMutation();

  const unregisterClientRegistrationToken =
    useUnregisterClientRegistrationTokenMutation();

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
        });
      }
    }

    doAsync().catch(console.error);
  }, [registerClientRegistrationToken]);

  const handleUnregisterPushNotificationSubscription = useCallback(() => {
    async function doAsync() {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const token = await getFirebaseMessagingToken();
        await unregisterClientRegistrationToken.mutateAsync({
          id: 'none',
          token,
        });
      }
    }

    doAsync().catch(console.error);
  }, [unregisterClientRegistrationToken]);

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
