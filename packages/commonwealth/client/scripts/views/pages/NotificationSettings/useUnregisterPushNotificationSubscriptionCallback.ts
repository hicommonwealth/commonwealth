import { getBrowserType } from 'helpers/browser';
import { useCallback } from 'react';
import { useUnregisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useUnregisterClientRegistrationTokenMutation';
import { computeChannelTypeFromBrowserType } from 'views/pages/NotificationSettings/computeChannelTypeFromBrowserType';
import { getFirebaseMessagingToken } from 'views/pages/NotificationSettings/getFirebaseMessagingToken';

export function useUnregisterPushNotificationSubscriptionCallback() {
  const unregisterClientRegistrationToken =
    useUnregisterClientRegistrationTokenMutation();

  return useCallback(async () => {
    const browserType = getBrowserType();
    const channelType = computeChannelTypeFromBrowserType(browserType);

    if (!channelType) return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const token = await getFirebaseMessagingToken();
      await unregisterClientRegistrationToken.mutateAsync({
        id: 0, // this should be the aggregate id (user?)
        token,
        channelType,
      });
      console.log('Push notifications unregistered.');
    }
  }, [unregisterClientRegistrationToken]);
}
