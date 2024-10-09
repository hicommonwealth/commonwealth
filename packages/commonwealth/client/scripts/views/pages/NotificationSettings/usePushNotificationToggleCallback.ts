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
    (active: boolean) => {
      async function doAsync() {
        if (active) {
          await registerCallback();
        } else {
          await unregisterCallback();
        }
      }

      doAsync().catch(console.error);
    },
    [registerCallback, unregisterCallback],
  );
}
