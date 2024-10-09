import { useCallback } from 'react';
// eslint-disable-next-line max-len
import { useRegisterPushNotificationSubscriptionCallback } from 'views/pages/NotificationSettings/useRegisterPushNotificationSubscriptionCallback';
// eslint-disable-next-line max-len
import { useUnregisterPushNotificationSubscriptionCallback } from 'views/pages/NotificationSettings/useUnregisterPushNotificationSubscriptionCallback';

export function usePushNotificationToggleCallback() {
  const registerCallback = useRegisterPushNotificationSubscriptionCallback();
  const unregisterCallback =
    useUnregisterPushNotificationSubscriptionCallback();

  return useCallback(
    async (active: boolean) => {
      if (active) {
        await registerCallback();
      } else {
        await unregisterCallback();
      }
    },
    [registerCallback, unregisterCallback],
  );
}
