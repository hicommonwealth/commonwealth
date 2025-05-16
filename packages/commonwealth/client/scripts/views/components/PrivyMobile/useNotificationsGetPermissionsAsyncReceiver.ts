import { useMobileRPCSender } from 'hooks/mobile/useMobileRPCSender';

type PermissionStatus = {
  status: 'granted' | 'denied' | 'undetermined';
};

export function useNotificationsGetPermissionsAsyncReceiver() {
  return useMobileRPCSender<{}, PermissionStatus>({
    type: 'Notifications.getPermissionsAsync',
  });
}
