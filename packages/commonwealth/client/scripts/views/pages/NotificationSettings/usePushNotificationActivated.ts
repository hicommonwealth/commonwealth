import { useCallback, useState } from 'react';

const LOCAL_STORAGE_KEY = 'pushNotificationsEnabled';

export function usePushNotificationActivated(): Readonly<
  [boolean, (newValue: boolean) => void]
> {
  const [checked, setChecked] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEY) === 'on',
  );

  const toggle = useCallback((newValue: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, newValue ? 'on' : 'off');
    setChecked(newValue);
  }, []);

  return [checked, toggle];
}
