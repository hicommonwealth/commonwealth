import { getBrowserType } from 'helpers/browser';
import { useCallback } from 'react';
// eslint-disable-next-line max-len
import { useRegisterClientRegistrationTokenMutation } from 'state/api/trpc/subscription/useRegisterClientRegistrationTokenMutation';
// eslint-disable-next-line max-len
import { computeChannelTypeFromBrowserType } from 'views/pages/NotificationSettings/computeChannelTypeFromBrowserType';
// eslint-disable-next-line max-len
import useUserStore from 'state/ui/user';

// FIXME use a dynamic async import for this?? ?
export function useRegisterPushNotificationSubscriptionCallback() {
  const registerClientRegistrationToken =
    useRegisterClientRegistrationTokenMutation();
  const user = useUserStore();

  return useCallback(async () => {
    const browserType = getBrowserType();
    const channelType = computeChannelTypeFromBrowserType(browserType);
    if (!channelType) return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log(
        'Notification permission granted for channelType: ' + channelType,
      );

      // this needs to be an async import so that it's not required inside the
      // PWA thereby breaking the mobile app since navigator.serviceWorker is
      // undefined there.
      const { getFirebaseMessagingToken } = await import(
        'views/pages/NotificationSettings/getFirebaseMessagingToken'
      );

      const token = await getFirebaseMessagingToken();
      await registerClientRegistrationToken.mutateAsync({
        id: user.id,
        token,
        channelType,
      });
      console.log('Push notifications registered.');
    }
  }, [registerClientRegistrationToken, user.id]);
}
