import React, { useCallback, useState } from 'react';
import { CWToggle } from 'views/components/component_kit/cw_toggle';

const LOCAL_STORAGE_KEY = 'pushNotificationsEnabled';

export const PushNotificationsToggle = () => {
  const [checked, setChecked] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEY) === 'on',
  );

  const handleChecked = useCallback((newValue: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, newValue ? 'on' : 'off');
    setChecked(newValue);
  }, []);

  return (
    <CWToggle checked={checked} onChange={() => handleChecked(!checked)} />
  );
};
