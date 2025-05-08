import { useMobileRPCSender } from 'client/scripts/hooks/mobile/useMobileRPCSender';

type PermissionStatus = {
  status: 'granted' | 'denied' | 'undetermined';
};

export function useNotificationsRequestPermissionsAsyncReceiver() {
  return useMobileRPCSender<{}, PermissionStatus>({
    type: 'Notifications.requestPermissionsAsync',
  });
}
