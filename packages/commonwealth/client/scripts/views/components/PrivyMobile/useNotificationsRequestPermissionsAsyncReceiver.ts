import { useMobileRPCSender } from 'client/scripts/hooks/mobile/useMobileRPCSender';

export function useNotificationsRequestPermissionsAsyncReceiver() {
  return useMobileRPCSender<{}, {}>({
    type: 'Notifications.requestPermissionsAsync',
  });
}
