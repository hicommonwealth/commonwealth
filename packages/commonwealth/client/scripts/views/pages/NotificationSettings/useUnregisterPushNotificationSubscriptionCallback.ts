import { getBrowserType } from 'helpers/browser';
import { useCallback } from 'react';
// eslint-disable-next-line max-len
import { useUnregisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useUnregisterClientRegistrationTokenMutation';
// eslint-disable-next-line max-len
import { computeChannelTypeFromBrowserType } from 'views/pages/NotificationSettings/computeChannelTypeFromBrowserType';
// eslint-disable-next-line max-len
import useUserStore from 'state/ui/user';

export function useUnregisterPushNotificationSubscriptionCallback() {
  const unregisterClientRegistrationToken =
    useUnregisterClientRegistrationTokenMutation();
  const user = useUserStore();

  return useCallback(async () => {
    const browserType = getBrowserType();
    const channelType = computeChannelTypeFromBrowserType(browserType);

    if (!channelType) return;

    console.log(
      'Registering push notifications for channelType: ' + channelType,
    );

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log(
        'Notification permission granted for channelType: ' + channelType,
      );

      const { getFirebaseMessagingToken } = await import(
        'views/pages/NotificationSettings/getFirebaseMessagingToken'
      );

      const token = await getFirebaseMessagingToken();
      await unregisterClientRegistrationToken.mutateAsync({
        id: user.id,
        token,
        channelType,
      });
      console.log('Push notifications unregistered.');
    }
  }, [unregisterClientRegistrationToken, user.id]);
}
