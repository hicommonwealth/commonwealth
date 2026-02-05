import { useCallback } from 'react';

type PermissionStatus = {
  status: 'granted' | 'denied' | 'undetermined';
};

export function useNotificationsRequestPermissionsAsyncReceiver() {
  return useCallback(async (_input: {}): Promise<PermissionStatus> => {
    if (typeof Notification === 'undefined') {
      return { status: 'denied' };
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch {
        permission = 'denied';
      }
    }

    return {
      status:
        permission === 'granted'
          ? 'granted'
          : permission === 'denied'
            ? 'denied'
            : 'undetermined',
    };
  }, []);
}
