import { getBrowserType } from 'helpers/browser';
import { useCallback } from 'react';
import { useRegisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useRegisterClientRegistrationTokenMutation';
import { computeChannelTypeFromBrowserType } from 'views/pages/NotificationSettings/computeChannelTypeFromBrowserType';
import { getFirebaseMessagingToken } from 'views/pages/NotificationSettings/getFirebaseMessagingToken';

export function useRegisterPushNotificationSubscriptionCallback() {
  const registerClientRegistrationToken =
    useRegisterClientRegistrationTokenMutation();

  return useCallback(async () => {
    const browserType = getBrowserType();
    const channelType = computeChannelTypeFromBrowserType(browserType);
    if (!channelType) return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const token = await getFirebaseMessagingToken();
      await registerClientRegistrationToken.mutateAsync({
        id: 0, // this should be the aggregate id (user?)
        token,
        channelType,
      });
      console.log('Push notifications registered.');
    }
  }, [registerClientRegistrationToken]);
}
