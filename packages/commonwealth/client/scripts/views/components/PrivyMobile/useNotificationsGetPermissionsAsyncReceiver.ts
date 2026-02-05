import { useCallback } from 'react';

type PermissionStatus = {
  status: 'granted' | 'denied' | 'undetermined';
};

export function useNotificationsGetPermissionsAsyncReceiver() {
  return useCallback(async (_input: {}): Promise<PermissionStatus> => {
    if (typeof Notification === 'undefined') {
      return { status: 'denied' };
    }

    const permission = Notification.permission;
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
