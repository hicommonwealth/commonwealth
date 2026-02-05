import { useCallback } from 'react';

type PermissionStatus = {
  status: 'granted' | 'denied' | 'undetermined';
};

export function useNotificationsGetPermissionsAsyncReceiver() {
  return useCallback((_input: {}): Promise<PermissionStatus> => {
    if (typeof Notification === 'undefined') {
      return Promise.resolve({ status: 'denied' });
    }

    const permission = Notification.permission;
    return Promise.resolve({
      status:
        permission === 'granted'
          ? 'granted'
          : permission === 'denied'
            ? 'denied'
            : 'undetermined',
    });
  }, []);
}
